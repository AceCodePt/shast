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
import { valueError } from "./value-error.ts";

type MergedKeywords = SupportedKeywordsConfig;

// The classes an element declares, from `attributes.class`.
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
// disagree, no single default applies.
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

// The area names a `grid-template-areas` value defines, split the same way the
// type-level `GridAreaNames` splits the literal: whitespace separates cells,
// each cell is an optionally quoted token, and `.` marks an empty cell. A
// CSS-wide keyword names no areas.
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

// A match-anything string DSL (`<string>`, `<custom-ident>`) cannot stop a
// value from carrying CSS structural punctuation. The renderer prints values
// verbatim (`box-shadow: ${value};`), so a top-level `;`, `{` or `}` would end
// the declaration or open a block and let the author inject arbitrary rules.
// Rejected here, at the single wall for text that reaches the stylesheet: every
// declaration value, keyframe frame value, `style()` query value and
// selector/header key passes through this. A caller emitting a key passes it as
// both arguments, so the message still names the offending text.
//
// Delimiters are legal inside a quoted string and inside a balanced function
// (`url(...)` data URLs carry `;` and `,`), so the scanner tracks quote state
// (with backslash escapes) and parenthesis depth. Two CSS tokenizer details
// matter: a string cannot contain a raw newline, and `url(` is a single token
// whose unquoted body has no strings or nested parens. `/*` opens a comment
// even inside parens, so it is rejected anywhere outside a quoted string.
//
// A brace inside a function body is rejected in-loop: `(; } .evil { ... })`
// returns to depth 0, so only the in-loop check catches it. The scan must also
// end at the top level -- an unclosed string, url token or paren means every
// later delimiter was consumed by the opener and never examined.
const isUrlTokenAt = (value: string, index: number): boolean => {
  if (value.slice(index, index + 3).toLowerCase() !== "url") return false;
  let next = index + 3;
  while (next < value.length && /\s/.test(value[next] as string)) next += 1;
  return value[next] === "(";
};

export const assertNoStructuralBreakout = (
  key: string,
  value: string,
): void => {
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
          // The opening quote is consumed here; step past it so the loop does
          // not reprocess it in the urlQuoted branch and mistake it for the
          // closing quote (which would leave a valid `url("...")` open).
          i += 1;
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
    // A brace inside a function body is structural even when the parens are
    // balanced: `(; } .evil { color: red })` returns to depth 0, so only an
    // in-loop check catches it. Quoted strings and url() bodies never reach
    // here -- their branches `continue` above -- and braces are legal there.
    if (depth > 0 && (char === "{" || char === "}")) {
      throw new Error(
        `CSS Error: '${key}' value contains a '${char}' inside a function, which would open a block inside the declaration`,
      );
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
  // The scan must end at the top level; an unclosed opener means every later
  // delimiter was consumed as part of it and never examined. Worded distinctly
  // from the in-loop "top-level" message so the two branches stay tellable.
  if (quote !== undefined) {
    throw new Error(
      `CSS Error: '${key}' value has an unterminated ${urlQuoted ? "quoted url()" : "string"} which never returns to the top level`,
    );
  }
  if (urlRaw) {
    throw new Error(
      `CSS Error: '${key}' value has an unterminated url() which never returns to the top level`,
    );
  }
  if (depth > 0) {
    throw new Error(
      `CSS Error: '${key}' value has an unterminated function or parenthesised block which never returns to the top level`,
    );
  }
};

// The deep half of CSS value validation: calc-shaped values go to calc's
// parser, values containing `var(` to var's resolver. The two are not
// exclusive -- `calc(var(--x) * 2)` runs both -- and other values are
// untouched. Kept separate from the shallow DSL check so a gate value, whose
// shallow check already ran during gate resolution, still reaches the deep
// walls. Every string also crosses the structural wall here.
//
// `dsl` is the syntax the value matched: a named numeric token lets calc's slot
// check confirm the result dimension (`calc(2Hz * 2)` on `<length-percentage>`
// fails). An unrecognised DSL leaves the check off.
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

// A CSS value passes the shallow DSL first, then the deep grammars. A shallow
// miss is tsyntax's bare prose, rethrown with the property, tag and tree path.
const parseCSSValueAgainstDSL = (
  keywords: MergedKeywords,
  key: string,
  dsl: string,
  value: unknown,
  varContext: {
    properties: Record<string, any>;
    defined: Record<string, string>;
  },
  tag: string | undefined,
  path: string,
): void => {
  try {
    parseValueAgainstDSL(keywords, dsl, value as never);
  } catch (error) {
    throw valueError("CSS Error", key, tag, path, error);
  }
  deepValidateCSSValue(key, value, varContext, dsl);
};

// What a CSS block is validating against: the target element's `innerHTML`
// (for `> child` selectors), its declared classes (for `&.class`), its tag
// (seeded into the implicit `display`), and its position in the tree. Queries,
// pseudo-classes and pseudo-elements pass these through; a `> child` block
// replaces them with the child's.
export interface CssBlockScope {
  innerHTML: InnerHTML;
  classes: string[];
  nodeTag: string | undefined;
  /** The element's position (`root > item > text`), for diagnostics. */
  path: string;
}

// Everything that varies between nested CSS blocks. `parentGates` /
// `parentGridAreas` are the enclosing element's explicit gates and literal
// `grid-template-areas`, resolving this block's children-slot props (`flex`,
// `grid-area`). `elementGates` / `elementGridAreas` are THIS element's
// effective gates and areas: the explicit gates of every same-element block on
// the path (`:hover`, `@media`, `&.class`) merged with this block's own. A
// `> child` or `::` block targets a different box, so it takes its parent slots
// from the enclosing element's effective state and resets the element slots.
// The tag's implicit display is not part of `elementGates` -- it is added only
// to the self slot, so it never unlocks children props.
interface CssBlockState extends CssBlockScope {
  parentGates: Record<string, string>;
  parentGridAreas: string | undefined;
  elementGates: Record<string, string>;
  elementGridAreas: string | undefined;
  inheritedVars: Record<string, string>;
  inPseudoElement: boolean;
}

// The registered pseudo-classes and pseudo-elements a `:`-keyed block may name.
// Pseudo-classes are global (`cssPseudoClassConfig`), with a tag free to declare
// more; pseudo-elements resolve per node from the target tag, mirroring the
// type wall. An unregistered key is rejected here, before its shape matters.
const assertRegisteredPseudoKey = (
  context: ValidationContext,
  state: CssBlockState,
  key: string,
): void => {
  if (key.startsWith("::")) {
    const declared: readonly string[] =
      (state.nodeTag === undefined
        ? undefined
        : context.tagConfig[state.nodeTag]?.cssPseudoElement) ?? [];
    if (!declared.includes(key)) {
      throw new Error(
        `CSS Error: Pseudo-element '${key}' is not declared on tag '${state.nodeTag}'. Declared pseudo-elements are: ${declared.join(", ")}`,
      );
    }
    return;
  }
  const tagPseudoClasses: readonly string[] =
    (state.nodeTag === undefined
      ? undefined
      : context.tagConfig[state.nodeTag]?.cssPseudoClass) ?? [];
  if (
    !context.registeredPseudoClasses.has(key) &&
    !tagPseudoClasses.includes(key)
  ) {
    const registered = new Set([
      ...context.registeredPseudoClasses,
      ...tagPseudoClasses,
    ]);
    throw new Error(
      `CSS Error: Pseudo-class '${key}' is not registered in the cssPseudoClassConfig. Registered pseudo-classes are: ${[...registered].join(", ")}`,
    );
  }
};

const STYLE_QUERY_PREFIX = "style(";

// The text inside each top-level `style(...)` condition of a registered
// `@container` query. The query grammar places `style(` at the start of a
// top-level condition, so this matches there and skips a `style(` that appears
// inside a quoted value. Balanced parentheses and quotes are tracked so a value
// may itself contain a function (`style(--x: calc(1px + 2px))`).
const styleQueryContents = (query: string): string[] => {
  const contents: string[] = [];
  let depth = 0;
  let quote: '"' | "'" | undefined;
  let i = 0;
  while (i < query.length) {
    const char = query[i] as string;
    if (quote !== undefined) {
      if (char === "\\") {
        i += 2;
        continue;
      }
      if (char === quote) quote = undefined;
      i += 1;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      i += 1;
      continue;
    }
    if (
      char === "(" &&
      depth === 0 &&
      i >= STYLE_QUERY_PREFIX.length - 1 &&
      query.startsWith(STYLE_QUERY_PREFIX, i - (STYLE_QUERY_PREFIX.length - 1))
    ) {
      let closeDepth = 1;
      let closeQuote: '"' | "'" | undefined;
      let j = i + 1;
      while (j < query.length && closeDepth > 0) {
        const inner = query[j] as string;
        if (closeQuote !== undefined) {
          if (inner === "\\") {
            j += 2;
            continue;
          }
          if (inner === closeQuote) closeQuote = undefined;
          j += 1;
          continue;
        }
        if (inner === '"' || inner === "'") {
          closeQuote = inner;
          j += 1;
          continue;
        }
        if (inner === "(") closeDepth += 1;
        else if (inner === ")") closeDepth -= 1;
        j += 1;
      }
      contents.push(
        query.slice(i + 1, closeDepth === 0 ? j - 1 : query.length),
      );
      i = j;
      continue;
    }
    if (char === "(") depth += 1;
    else if (char === ")") depth -= 1;
    i += 1;
  }
  return contents;
};

// A `style()` container query embeds a `--property: value` pair inside the
// at-rule header, which the renderer prints verbatim (`frame.atRule`).
// `cssQueriesConfig` validates the query's shape but not the value, so the
// engine re-reads each condition and applies the same walls a declaration gets:
// the property must be registered and the value must clear the structural scan.
// This lives at engine time because `cssPropertiesConfig` is in scope and
// `css/queries-config` must not import engine code.
const assertStyleQueryValues = (
  context: ValidationContext,
  key: string,
): void => {
  for (const content of styleQueryContents(key)) {
    const colon = content.indexOf(":");
    if (colon === -1) continue; // shape already checked by cssQueriesConfig
    const property = content.slice(0, colon).trim();
    const value = content.slice(colon + 1).trim();
    if (!property.startsWith("--")) continue;
    if (context.cssPropertiesConfig[property] === undefined) {
      throw new Error(
        `CSS Error: Style query property '${property}' is not registered in the cssPropertiesConfig. Registered properties are: ${Object.keys(context.cssPropertiesConfig).join(", ")}`,
      );
    }
    assertNoStructuralBreakout(property, value);
  }
};

// Validate one `css` block against the element's structure. A complex CSS
// attribute (`display`, `position`, ...) is a *gate*: the value the author
// writes unlocks further props on the node itself (`self`) and on its direct
// children (`children`). The helpers in `engine/gate-resolution.ts` mirror the
// type-level gate tables in `engine/types.ts`, and serve the HTML layer too.
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

    // Gates the author wrote in this scope, in any order.
    const explicitGates: Record<string, string> = {};

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
        // Gate resolution ran only the shallow pattern match; a calc- or
        // var-shaped gate value still needs the deep walls, or
        // `opacity: "calc(2px * 3px)"` would pass the runtime while the type
        // wall rejected it. `matched` is the slot DSL, so the dimension check
        // applies too.
        deepValidateCSSValue(key, written, varContext, matched);
      }
    }
    // The element's effective gates: same-element blocks' gates merged with
    // the ones written here. This block's value wins, so an explicit `display`
    // here overrides one inherited from a `:hover` / query ancestor rather than
    // intersecting the two into `never`.
    const elementGates: Record<string, string> = {
      ...state.elementGates,
      ...explicitGates,
    };

    // The self slot reads the element's gates plus the tag's implicit `display`,
    // but only when no same-element block wrote a `display` (an explicit value,
    // including a CSS-wide keyword, always wins). The children slot never sees
    // the implicit display: `parentGates` carries explicit gates only.
    const selfGates: Record<string, string> = { ...elementGates };
    const defaultDisplay =
      state.nodeTag !== undefined
        ? context.tagConfig[state.nodeTag]?.display
        : undefined;
    if (
      defaultDisplay !== undefined &&
      elementGates["display"] === undefined &&
      isGateDefinition(cssAttrs["display"])
    ) {
      selfGates["display"] = defaultDisplay;
    }

    // The element's own `grid-template-areas`, inherited through same-element
    // blocks. A `> child` / `::` block resolves its children's `grid-area`
    // against this, so the cross-check survives `:hover` / `@media` nesting.
    const ownGridAreas = gridAreasOf(block);
    const elementGridAreas =
      ownGridAreas !== undefined ? ownGridAreas : state.elementGridAreas;

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
        // The class must be one the element declares, mirroring the type wall's
        // `&.${K}` keys derived from `T["attributes"]["class"]`. `state.classes`
        // is the declaring scope's class list: the element itself, or the
        // `> child` target when nested under a child selector.
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
        if (key.startsWith("@container") && key.includes(STYLE_QUERY_PREFIX)) {
          // The header is printed verbatim as the at-rule, so its `style()`
          // values are stylesheet text: check each property and value, then
          // scan the whole header as the backstop for text the targeted scan
          // does not cover.
          assertStyleQueryValues(context, key);
          assertNoStructuralBreakout(key, key);
        }
        const nextInPseudoElement = key.startsWith("::") || state.inPseudoElement;
        // A query targets the same element, so it inherits this block's
        // effective element state (the same-element merge), not the incoming
        // one. `parentGates` / `parentGridAreas` pass through unchanged.
        walk(value as Record<string, unknown>, {
          ...state,
          elementGates,
          elementGridAreas,
          inheritedVars: definedVars,
          inPseudoElement: nextInPseudoElement,
        });
        continue;
      }
      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        if (key.startsWith(":")) {
          // A pseudo key becomes selector text (`segmentText` prints it
          // verbatim). Registry membership is the fix; the structural scan is
          // the in-loop backstop, independent of the registry. The check is
          // unconditional (not skipped inside a pseudo-element) so nesting is
          // decided by the registry, not shape.
          assertRegisteredPseudoKey(context, state, key);
          assertNoStructuralBreakout(key, key);
        }
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
        // A `> child` block moves the diagnostic path to that child; query,
        // class, and pseudo blocks stay on the element under validation.
        const nextPath = key.startsWith("> ")
          ? `${state.path} > ${key.slice(2)}`
          : state.path;
        // A `> child` and a `::` pseudo-element block target a different box:
        // they take their children-slot gates and grid-area cross-check from the
        // enclosing element's effective state and start a fresh element state
        // from their own block. Every other nested block (`:`, `@`, `&.`)
        // targets the SAME element and inherits the element state. This mirrors
        // the type level, where `> child` / `::` pass `CSSElementValue` as
        // `CSSParent` and reset it, while `:` / `@` / `&.` merge it.
        const targetsOwnBox = key.startsWith("> ") || key.startsWith("::");
        walk(value as Record<string, unknown>, {
          innerHTML: nextContext,
          classes: nextClasses,
          nodeTag: nextTag,
          path: nextPath,
          parentGates: targetsOwnBox ? elementGates : state.parentGates,
          parentGridAreas: targetsOwnBox
            ? elementGridAreas
            : state.parentGridAreas,
          elementGates: targetsOwnBox ? {} : elementGates,
          elementGridAreas: targetsOwnBox ? undefined : elementGridAreas,
          inheritedVars: definedVars,
          inPseudoElement: nextInPseudoElement,
        });
      } else if (
        !key.startsWith("> ") &&
        !key.startsWith("&.") &&
        !key.startsWith(":")
      ) {
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
              state.nodeTag,
              state.path,
            );
            // `animation-name` / `animation` must reference a registered
            // keyframe. The base DSL still validates the value's shape; this is
            // the closed-world reference check on top.
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
              state.nodeTag,
              state.path,
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
              state.nodeTag,
              state.path,
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
              state.nodeTag,
              state.path,
            );
            // `grid-area` names an area the parent's `grid-template-areas` must
            // define. The DSL checks only the value's shape (`<custom-ident>` is
            // any string); this is the closed-world cross-reference on top,
            // mirroring the type-level `GridAreaConstraint`.
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
      } else if (key.startsWith(":")) {
        // A pseudo key with a non-block value never reaches the nested-block
        // check above, so give it the pseudo-specific message.
        const kind = key.startsWith("::") ? "pseudo-element" : "pseudo-class";
        throw new Error(
          `CSS Error: '${key}' is not a registered ${kind}`,
        );
      }
    }
  };

  walk(css, {
    innerHTML: scope.innerHTML,
    classes: scope.classes,
    nodeTag: scope.nodeTag,
    path: scope.path,
    parentGates: {},
    parentGridAreas: undefined,
    elementGates: {},
    elementGridAreas: undefined,
    inheritedVars: {},
    inPseudoElement: false,
  });
}
