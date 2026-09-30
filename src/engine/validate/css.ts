import {
  parseValueAgainstDSL,
  type SupportedKeywordsConfig,
} from "tsyntax";
import {
  isGateDefinition,
  lockedMessageFor,
  resolveGateValue,
  slotDSL,
} from "@/engine/gate-resolution.ts";
import { CSS_IDENTIFIER_REGEX as CSS_CLASS_NAME } from "@/css/ident.ts";
import { isCSSWideKeyword } from "@/css/wide-keyword.ts";
import { isCalcString, parseCalc, slotDimensionsOf } from "@/css/calc.ts";
import { containsVar, validateVars } from "@/css/var.ts";
import {
  animationReferenceError,
  referencesRegisteredKeyframe,
} from "@/engine/animation.ts";
import type { BaseComponentStructure } from "@/engine/types.ts";
import type { InnerHTML, ValidationContext } from "./context.ts";

// `mergedKeywords` (CSS syntax layered with the component's supported keywords)
// is structurally a `SupportedKeywordsConfig`, which is what the DSL parser
// type wants; alias it so the intent reads at the call site.
type MergedKeywords = SupportedKeywordsConfig;

// The classes an element declares, read from `attributes.class`. Used both to
// seed a node's own scope and to resolve the declaring scope of a `> child`
// block whose target is an array.
export const classesOf = (node: unknown): string[] => {
  const attrs =
    node !== null && typeof node === "object"
      ? (node as Record<string, unknown>)["attributes"]
      : undefined;
  const classValue =
    attrs !== null && typeof attrs === "object"
      ? (attrs as Record<string, unknown>)["class"]
      : undefined;
  return typeof classValue === "string" && classValue.length > 0
    ? classValue.split(/\s+/).filter((name) => name !== "")
    : [];
};

// The distinct tags in an array of children; used to seed the implicit
// `display` inside a `> child` block that targets an array. When the children
// disagree, no single default display applies.
const tagsOf = (children: unknown[]): string[] => {
  const tags = new Set<string>();
  for (const child of children) {
    if (child !== null && typeof child === "object" && !Array.isArray(child)) {
      const childTag = (child as BaseComponentStructure).tag;
      if (typeof childTag === "string") tags.add(childTag);
    }
  }
  return [...tags];
};

// The area names a `grid-template-areas` value defines, parsed the same way the
// type-level `GridAreaNames` splits the literal: whitespace (spaces, newlines,
// tabs) separates cells, each cell is an optionally quoted token, and `.` marks
// an empty cell and contributes no name. A CSS-wide keyword names no areas.
const parseGridAreaNames = (areas: string): Set<string> => {
  const names = new Set<string>();
  for (const rawToken of areas.split(/\s+/)) {
    const token = rawToken.replace(/^["']+/, "").replace(/["']+$/, "");
    if (token === "" || token === ".") continue;
    names.add(token);
  }
  return names;
};

// The parent's own `grid-template-areas`, or `undefined` when it did not write
// a literal (absent, or a CSS-wide keyword): an unknown parent must constrain
// nothing.
const gridAreasOf = (block: Record<string, unknown>): string | undefined => {
  const value = block["grid-template-areas"];
  if (typeof value !== "string" || isCSSWideKeyword(value)) return undefined;
  return value;
};

// A string DSL such as `<string>` or `<custom-ident>` matches anything, so the
// shallow DSL check cannot stop a value from carrying CSS structural
// punctuation. The renderer prints the value verbatim (`box-shadow: ${value};`),
// so a `;`, `{` or `}` at the top level of a value would end the declaration or
// open/close a block and let the author inject arbitrary rules. Reject that at
// the runtime wall, where calc()/var() already refuse the same shape.
//
// The delimiters are legal inside a quoted string (a `content` value may
// contain `}`, grid-template-areas is quoted) and inside a balanced function
// such as `url(...)` (data URLs carry `;` and `,`), so the scanner tracks quote
// state -- with backslash escapes -- and parenthesis depth. Two CSS tokenizer
// details matter, because the scanner must agree with the browser about where a
// quote or parenthesis ends:
//
//   * a string cannot contain a raw newline, so an unescaped newline ends it;
//   * `url(` is a single token: an unquoted url body has no strings and no
//     nested parentheses, so `url(a"b)` and `url(a(b)` end at the first `)` and
//     the quote or `(` inside is literal text, not structure.
//
// `/*` opens a comment even inside parentheses, so it is rejected anywhere
// outside a quoted string.
const isUrlTokenAt = (value: string, index: number): boolean => {
  if (value.slice(index, index + 3).toLowerCase() !== "url") return false;
  let next = index + 3;
  while (next < value.length && /\s/.test(value[next] as string)) next += 1;
  return value[next] === "(";
};

const assertNoStructuralBreakout = (key: string, value: string): void => {
  let depth = 0;
  let quote: '"' | "'" | undefined;
  // True while inside a quoted `url("...")` token; `)` there closes the url.
  let urlQuoted = false;
  // True while inside an unquoted `url(...)` body; none of `"'()` are structure.
  let urlRaw = false;
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (urlQuoted) {
      if (char === "\\") {
        i += 1;
        continue;
      }
      const urlQuote = quote as '"' | "'";
      if (char === urlQuote || char === "\n" || char === "\r" || char === "\f") {
        quote = undefined;
        urlQuoted = false;
      }
      continue;
    }
    if (urlRaw) {
      if (char === "\\") {
        i += 1;
        continue;
      }
      if (char === ")") {
        urlRaw = false;
        if (depth > 0) depth -= 1;
      }
      continue;
    }
    if (quote !== undefined) {
      if (char === "\\") {
        i += 1; // the next character is escaped, even a closing quote
        continue;
      }
      // An unescaped terminating quote always ends the string; a raw newline
      // ends it too, because CSS strings cannot span lines.
      if (char === quote || char === "\n" || char === "\r" || char === "\f") {
        quote = undefined;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "(") {
      depth += 1;
      if (depth === 1 && isUrlTokenAt(value, i - 3)) {
        const body = value[i + 1];
        if (body === '"' || body === "'") {
          quote = body;
          urlQuoted = true;
        } else {
          urlRaw = true;
        }
      }
      continue;
    }
    if (char === ")") {
      if (depth > 0) depth -= 1;
      continue;
    }
    if (depth === 0 && (char === ";" || char === "{" || char === "}")) {
      throw new Error(
        `CSS Error: '${key}' value contains a top-level '${char}' which would break out of the declaration`,
      );
    }
    if (char === "/" && value[i + 1] === "*") {
      throw new Error(
        `CSS Error: '${key}' value contains '/*' which would open a comment`,
      );
    }
  }
};

// The deep half of CSS value validation: calc-shaped values are handed to
// calc's parser, and any value containing a `var(` call is handed to var's
// resolver. The two are not exclusive -- a `calc()` may contain `var()`
// operands, and both run, so `calc(var(--x) * 2)` validates the expression
// *and* resolves `--x` against the registry. Non-calc, non-var values are
// untouched. Kept separate from the shallow DSL check so a gate value, whose
// shallow check already ran during gate resolution, can still reach the deep
// walls.
//
// Every string value also crosses the structural wall here, so a value that
// matched a match-anything DSL (`<string>`, `<custom-ident>`) cannot smuggle a
// declaration break-out past the renderer.
//
// `dsl` is the syntax the value matched: when it is a named numeric token,
// calc's slot check confirms the expression's result dimension is one the
// property accepts (`calc(2Hz * 2)` on `<length-percentage>` fails). An
// unrecognised DSL leaves the check off.
const deepValidateCSSValue = (
  key: string,
  value: unknown,
  varContext?: {
    properties: Record<string, any>;
    defined: Record<string, string>;
  },
  dsl?: string,
): void => {
  if (typeof value === "string") assertNoStructuralBreakout(key, value);
  if (isCalcString(value)) {
    const expected = dsl === undefined ? undefined : slotDimensionsOf(dsl);
    if (varContext === undefined) {
      parseCalc(
        value,
        expected === undefined ? undefined : { properties: {}, expected },
      );
    } else {
      parseCalc(
        value,
        expected === undefined
          ? { properties: varContext.properties }
          : { properties: varContext.properties, expected },
      );
    }
  }
  if (varContext !== undefined && containsVar(value)) {
    validateVars(value, {
      properties: varContext.properties,
      defined: varContext.defined,
    });
  }
};

// A CSS value passes the shallow DSL first, then the deep grammars.
const parseCSSValueAgainstDSL = (
  keywords: MergedKeywords,
  key: string,
  dsl: string,
  value: unknown,
  varContext: {
    properties: Record<string, any>;
    defined: Record<string, string>;
  },
): void => {
  parseValueAgainstDSL(keywords, dsl, value as never);
  deepValidateCSSValue(key, value, varContext, dsl);
};

// What a CSS block is validating against: the target element's `innerHTML`
// (for `> child` selectors), its declared classes (for `&.class`), and its tag
// (seeded into the tag's implicit `display`). Queries, pseudo-classes and
// pseudo-elements pass these through unchanged; a `> child` block replaces
// them with the child's.
export interface CssBlockScope {
  innerHTML: InnerHTML;
  classes: string[];
  nodeTag: string | undefined;
}

// Everything that varies between nested CSS blocks. `block` is the one under
// validation; the rest is the surrounding scope the type-level walk encodes.
interface CssBlockState extends CssBlockScope {
  parentGates: Record<string, string>;
  inheritedVars: Record<string, string>;
  inPseudoElement: boolean;
  parentGridAreas: string | undefined;
}

// Validate one `css` block against the element's structure. A complex CSS
// attribute (`display`, `position`, ...) is a *gate*: the value the author
// writes unlocks further props on the node itself (`self`) and on its direct
// children (`children`). The shared helpers in `engine/gate-resolution.ts`
// mirror the type-level gate tables in `engine/types.ts` so the two walls
// agree, and serve the HTML layer too.
export function validateCssBlock(
  context: ValidationContext,
  css: Record<string, unknown>,
  scope: CssBlockScope,
): void {
  const walk = (block: Record<string, unknown>, state: CssBlockState): void => {
    const { cssPropertiesConfig: cssProps, cssAttributesConfig: cssAttrs } =
      context;

    // Custom properties defined in this scope, layered over the ones
    // inherited from enclosing scopes. CSS custom properties inherit, so a
    // `var()` may reference either. Component-written values shadow the
    // registry; cycle detection walks this map together with it.
    const definedVars: Record<string, string> = { ...state.inheritedVars };
    for (const key of Object.keys(block)) {
      if (key.startsWith("--") && cssProps[key] !== undefined) {
        const definition = block[key];
        if (typeof definition === "string") definedVars[key] = definition;
      }
    }
    const varContext = { properties: cssProps, defined: definedVars };

    // Gates the author wrote in this scope, in any order, plus the tag's
    // default `display` when they did not write one (implicit display).
    const explicitGates: Record<string, string> = {};
    const selfGates: Record<string, string> = {};

    for (const key of Object.keys(block)) {
      if (key.startsWith("> ") || key.startsWith("&.")) continue;
      if (isGateDefinition(cssAttrs[key])) {
        const written = block[key];
        if (isCSSWideKeyword(written)) {
          // A CSS-wide keyword is valid on every property, but it matches no
          // gate variant, so it unlocks nothing. Recording it still counts as
          // writing the gate, which suppresses the tag's implicit default.
          explicitGates[key] = written;
          continue;
        }
        const matched = resolveGateValue(
          context.mergedKeywords,
          key,
          cssAttrs[key],
          written,
          "CSS",
        );
        explicitGates[key] = matched;
        // Gate resolution only ran the shallow pattern match; a calc- or
        // var-shaped gate value still needs the deep walls. Without this,
        // `opacity: "calc(2px * 3px)"` would pass the runtime while the type
        // wall rejected it. The matched key is the slot DSL (`<alpha-value>`
        // for opacity), so calc's dimension check applies too.
        deepValidateCSSValue(key, written, varContext, matched);
      }
    }
    const defaultDisplay =
      state.nodeTag !== undefined
        ? context.tagConfig[state.nodeTag]?.display
        : undefined;
    if (defaultDisplay !== undefined && isGateDefinition(cssAttrs["display"])) {
      selfGates["display"] = defaultDisplay;
    }
    Object.assign(selfGates, explicitGates);

    for (const key of Object.keys(block)) {
      if (key.startsWith("> ")) {
        const childName = key.slice(2);
        if (
          !state.innerHTML ||
          typeof state.innerHTML === "string" ||
          !(childName in state.innerHTML)
        ) {
          throw new Error(
            `CSS Error: Child selector '${key}' references child '${childName}' which is not declared in the element's innerHTML`,
          );
        }
      }
      if (key.startsWith("&.")) {
        if (state.inPseudoElement) {
          throw new Error(
            `CSS Error: Class selector '${key}' is not allowed inside a pseudo-element block`,
          );
        }
        const className = key.slice(2);
        if (!CSS_CLASS_NAME.test(className)) {
          throw new Error(
            `CSS Error: Class selector '${key}' has an invalid class name '${className}'`,
          );
        }
        // The class must be one the element declares, mirroring the type
        // wall's `&.${K}` keys derived from `T["attributes"]["class"]`.
        // `state.classes` is the declaring scope's class list: the element
        // itself, or the `> child` target when this block is nested under a
        // child selector. Query blocks pass it through unchanged, so this
        // composes with them exactly as with pseudo-class/element blocks.
        if (!state.classes.includes(className)) {
          throw new Error(
            `CSS Error: Class selector '${key}' references class '${className}' which is not declared on the element`,
          );
        }
      }
      const value = block[key];
      if (key.startsWith("@")) {
        // A query key (`@media ...` / `@container ...`). The key must be an
        // exact registered query string; the block then validates with the
        // same node/context (queries never change the target element).
        if (!context.registeredQueries.has(key)) {
          throw new Error(
            `CSS Error: Query '${key}' is not registered in the cssQueriesConfig. Registered queries are: ${[...context.registeredQueries].join(", ")}`,
          );
        }
        if (
          value === null ||
          typeof value !== "object" ||
          Array.isArray(value)
        ) {
          throw new Error(
            `CSS Error: Query block '${key}' must be a CSS block object`,
          );
        }
        const nextInPseudoElement = key.startsWith("::") || state.inPseudoElement;
        walk(value as Record<string, unknown>, {
          ...state,
          inheritedVars: definedVars,
          inPseudoElement: nextInPseudoElement,
        });
        continue;
      }
      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        let nextContext = state.innerHTML;
        let nextClasses = state.classes;
        let nextTag = state.nodeTag;
        if (key.startsWith("> ")) {
          const childName = key.slice(2);
          if (
            state.innerHTML &&
            typeof state.innerHTML === "object" &&
            childName in state.innerHTML
          ) {
            const rawChild = (state.innerHTML as Record<string, unknown>)[
              childName
            ];
            if (Array.isArray(rawChild)) {
              const merged: Record<string, unknown> = {};
              const mergedClasses = new Set<string>();
              for (const item of rawChild) {
                if (
                  item &&
                  typeof item === "object" &&
                  !Array.isArray(item)
                ) {
                  for (const cls of classesOf(item)) {
                    mergedClasses.add(cls);
                  }
                  const childInner = (item as Record<string, unknown>)[
                    "innerHTML"
                  ];
                  if (
                    childInner &&
                    typeof childInner === "object" &&
                    !Array.isArray(childInner)
                  ) {
                    for (const [k, v] of Object.entries(
                      childInner as Record<string, unknown>,
                    )) {
                      if (Array.isArray(v)) {
                        const existing = merged[k];
                        merged[k] =
                          existing && Array.isArray(existing)
                            ? [...existing, ...v]
                            : [...v];
                      } else {
                        merged[k] = v;
                      }
                    }
                  }
                }
              }
              nextContext =
                Object.keys(merged).length > 0
                  ? (merged as InnerHTML)
                  : undefined;
              nextClasses = [...mergedClasses];
              const tags = tagsOf(rawChild);
              nextTag = tags.length === 1 ? tags[0] : undefined;
            } else if (
              rawChild &&
              typeof rawChild === "object" &&
              !Array.isArray(rawChild)
            ) {
              nextContext =
                "innerHTML" in (rawChild as Record<string, unknown>)
                  ? ((rawChild as Record<string, unknown>)[
                      "innerHTML"
                    ] as InnerHTML)
                  : undefined;
              nextClasses = classesOf(rawChild);
              nextTag = (rawChild as BaseComponentStructure).tag;
            } else {
              nextContext = undefined;
              nextClasses = [];
              nextTag = undefined;
            }
          }
        }
        const nextInPseudoElement = key.startsWith("::") || state.inPseudoElement;
        // A `> child` block and a `::` pseudo-element block resolve their
        // grid-area against this scope's own grid-template-areas (mirroring
        // CSSParent = CSSValue at the type level); every other nested block
        // passes the enclosing scope's areas through unchanged.
        const nextGridAreas =
          key.startsWith("> ") || key.startsWith("::")
            ? gridAreasOf(block)
            : state.parentGridAreas;
        walk(value as Record<string, unknown>, {
          innerHTML: nextContext,
          classes: nextClasses,
          nodeTag: nextTag,
          // `> child` blocks inherit this scope's EXPLICIT gates for the
          // children slot; pseudo-class / class / pseudo-element blocks pass
          // the parent gates through unchanged.
          parentGates: key.startsWith("> ") ? explicitGates : state.parentGates,
          inheritedVars: definedVars,
          inPseudoElement: nextInPseudoElement,
          parentGridAreas: nextGridAreas,
        });
      } else if (!key.startsWith("> ") && !key.startsWith("&.")) {
        const attrDef = cssAttrs[key];
        const propDef = cssProps[key];

        // CSS-wide keywords are valid on every property. They are accepted
        // before property-specific matching, at the one seam every value
        // flows through; the property's own syntax is still enforced for
        // every other value.
        const isKeyword = isCSSWideKeyword(value);

        if (typeof attrDef === "string") {
          if (!isKeyword) {
            parseCSSValueAgainstDSL(
              context.mergedKeywords,
              key,
              attrDef,
              value,
              varContext,
            );
            // `animation-name` / `animation` must reference a registered
            // keyframe. The base DSL above still validates the value's shape;
            // this is the closed-world reference check on top.
            if (
              !referencesRegisteredKeyframe(
                key,
                value,
                context.cssKeyframesConfig,
              )
            ) {
              throw new Error(
                animationReferenceError(
                  key,
                  value,
                  context.cssKeyframesConfig,
                ),
              );
            }
          }
          continue;
        }
        if (isGateDefinition(attrDef)) {
          continue; // gate already resolved (and validated) in the pre-pass
        }
        if (propDef !== undefined) {
          if (
            !isKeyword &&
            typeof propDef === "object" &&
            typeof propDef.syntax === "string"
          ) {
            parseCSSValueAgainstDSL(
              context.mergedKeywords,
              key,
              propDef.syntax,
              value,
              varContext,
            );
          }
          continue;
        }
        const selfDSL = slotDSL(cssAttrs, selfGates, key, "self");
        if (selfDSL !== undefined) {
          if (!isKeyword) {
            parseCSSValueAgainstDSL(
              context.mergedKeywords,
              key,
              selfDSL,
              value,
              varContext,
            );
          }
          continue;
        }
        const childrenDSL = slotDSL(cssAttrs, state.parentGates, key, "children");
        if (childrenDSL !== undefined) {
          if (!isKeyword) {
            parseCSSValueAgainstDSL(
              context.mergedKeywords,
              key,
              childrenDSL,
              value,
              varContext,
            );
            // `grid-area` names an area the parent's `grid-template-areas`
            // must define. The DSL above only checks the value's shape
            // (`<custom-ident>` is any string); this is the closed-world
            // cross-reference on top, mirroring the type-level
            // `GridAreaConstraint`.
            if (key === "grid-area" && state.parentGridAreas !== undefined) {
              const areaNames = parseGridAreaNames(state.parentGridAreas);
              if (typeof value !== "string" || !areaNames.has(value)) {
                throw new Error(
                  `CSS Error: grid-area '${String(value)}' does not match any area defined by the parent's grid-template-areas (${areaNames.size > 0 ? [...areaNames].join(", ") : "none"})`,
                );
              }
            }
          }
          continue;
        }
        const locked = lockedMessageFor(cssAttrs, key);
        if (locked !== null) {
          throw new Error(`CSS Error: ${locked}`);
        }
        throw new Error(
          `CSS Error: '${key}' is not a recognized CSS attribute or property`,
        );
      }
    }
  };

  walk(css, {
    innerHTML: scope.innerHTML,
    classes: scope.classes,
    nodeTag: scope.nodeTag,
    parentGates: {},
    inheritedVars: {},
    inPseudoElement: false,
    parentGridAreas: undefined,
  });
}
