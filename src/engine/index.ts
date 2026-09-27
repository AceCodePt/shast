import type {
  BaseCSSAttributesComplexConfig,
  ValidateCSSAttributesConfig,
} from "@/css/attribute-config/types.ts";
import type {
  BaseCSSPropertiesConfig,
  ValidateCSSPropertiesConfig,
} from "@/css/properties-config/types.ts";
import type { BaseCSSPseudoClassConfig } from "@/css/pseudo-class-config/types.ts";
import type {
  BaseCSSSyntaxConfig,
  ValidateCSSSyntaxConfig,
} from "@/css/syntax-config/types.ts";
import type { BaseKeyframesConfig } from "@/css/keyframes-config/types.ts";
import {
  animationReferenceError,
  referencesRegisteredKeyframe,
} from "@/engine/animation.ts";
import {
  parseValueAgainstDSL,
  type SupportedKeywordsConfig,
} from "tsyntax";
import type {
  BaseHTMLAttributesConfig,
  ValidateHTMLAttributesConfig,
} from "@/html/attribute-config/types.ts";
import type {
  BaseHTMLTagConfig,
  ValidateHTMLTagConfig,
} from "@/html/tag-config/types.ts";
import { renderCSSPropertiesConfig } from "@/engine/render/properties-config.ts";
import { renderComponent } from "@/engine/render/render-component.ts";
import { CSS_IDENTIFIER_REGEX as CSS_CLASS_NAME } from "@/css/ident.ts";
import { isCSSWideKeyword } from "@/css/wide-keyword.ts";
import { isCalcString, parseCalc } from "@/css/calc.ts";
import { containsVar, validateVars } from "@/css/var.ts";
import {
  htmlSlotDSL,
  isGateDefinition,
  lockedMessageFor,
  resolveGateValue,
  slotDSL,
} from "@/engine/gate-resolution.ts";
import type {
  BaseComponentStructure,
  ValidateComponentStructure,
} from "@/engine/types.ts";

type AllowedTagSet = Set<string> | null;

// A valid CSS class identifier: a letter/underscore/hyphen (or non-ASCII) start,
// then letters/digits/hyphens/underscores (or non-ASCII). Unlike class
// *existence* (which is dynamic and unsound to reject at runtime), an invalid
// class *name* is always malformed regardless of state, so it is safe to throw.

function intersectAllowed(
  inheritedAllowed: AllowedTagSet,
  list: readonly string[],
): Set<string> {
  if (inheritedAllowed === null) {
    return new Set(list);
  }
  return new Set(list.filter((entry) => inheritedAllowed.has(entry)));
}

// The area names a `grid-template-areas` value defines, parsed the same way the
// type-level `GridAreaNames` splits the literal: whitespace (spaces, newlines,
// tabs) separates cells, each cell is an optionally quoted token, and `.` marks
// an empty cell and contributes no name. A CSS-wide keyword names no areas.
function parseGridAreaNames(areas: string): Set<string> {
  const names = new Set<string>();
  for (const rawToken of areas.split(/\s+/)) {
    const token = rawToken.replace(/^["']+/, "").replace(/["']+$/, "");
    if (token === "" || token === ".") continue;
    names.add(token);
  }
  return names;
}

// The parent's own `grid-template-areas`, or `undefined` when it did not write
// a literal (absent, or a CSS-wide keyword): an unknown parent must constrain
// nothing.
function gridAreasOf(block: Record<string, unknown>): string | undefined {
  const value = block["grid-template-areas"];
  if (typeof value !== "string" || isCSSWideKeyword(value)) return undefined;
  return value;
}

// A CSS value passes the shallow DSL first. When the value is a `calc()`
// expression the deep calc grammar parser runs on top, exactly as the type-level
// `CalcConstraint` does. When the value contains any `var()` reference the deep
// var parser resolves it against the CSS Properties registry, exactly as the
// type-level `VarConstraint` does. Non-calc, non-var values are untouched.
function parseCSSValueAgainstDSL(
  keywords: SupportedKeywordsConfig,
  dsl: string,
  value: unknown,
  varContext?: {
    properties: Record<string, any>;
    defined: Record<string, string>;
  },
): void {
  parseValueAgainstDSL(keywords, dsl, value as never);
  if (isCalcString(value)) {
    parseCalc(value);
  }
  if (varContext !== undefined && containsVar(value)) {
    validateVars(value, {
      dslConfig: keywords as unknown as Record<string, string>,
      dsl,
      properties: varContext.properties,
      defined: varContext.defined,
    });
  }
}

export function validateComponentNode(
  node: unknown,
  keywords: SupportedKeywordsConfig,
  globalAttributes: BaseHTMLAttributesConfig,
  tagConfig: BaseHTMLTagConfig,
  cssAttributesConfig: Record<string, any>,
  cssPropertiesConfig: Record<string, any>,
  cssQueriesConfig: readonly string[],
  cssKeyframesConfig: BaseKeyframesConfig,
  inheritedAllowed: AllowedTagSet,
  mergedKeywords: Record<string, string>,
): void {
  if (node === null || typeof node !== "object" || Array.isArray(node)) {
    throw new Error(
      "Validation Error: Provided node is not a valid component object",
    );
  }

  const record = node as BaseComponentStructure;

  const tag = record.tag;
  if (typeof tag !== "string") {
    throw new Error(
      "Validation Error: Component node is missing a valid string 'tag' property",
    );
  }

  const tagDefinition = tagConfig[tag];
  if (tagDefinition === undefined) {
    throw new Error(
      `Structural Error: '<${tag}>' is not a recognized configuration tag in your registry`,
    );
  }

  const attributes = record.attributes;
  const tagAttributes = tagDefinition.attributes ?? {};
  const allAttributeDefs = {
    ...globalAttributes,
    ...tagAttributes,
  };
  const providedAttributes = attributes ?? {};

  // Resolve every gate written on this element first. Its value unlocks
  // further attributes on the same element. A gate written as `undefined` is
  // treated as omitted, so it contributes its declared default (`undefined`
  // arm) exactly as the type wall's `DependentHTMLProps` does.
  const ownGates: Record<string, string> = {};
  for (const [attributeKey, value] of Object.entries(providedAttributes)) {
    const def = allAttributeDefs[attributeKey];
    if (isGateDefinition(def)) {
      if (value === undefined) continue;
      ownGates[attributeKey] = resolveGateValue(
        keywords,
        attributeKey,
        def,
        value,
        "Attribute",
      );
    }
  }

  for (const [attributeKey, value] of Object.entries(providedAttributes)) {
    const def = allAttributeDefs[attributeKey];
    if (typeof def === "string") {
      parseValueAgainstDSL(keywords, def, value);
      continue;
    }
    if (isGateDefinition(def)) {
      continue; // resolved and validated in the pre-pass
    }
    const unlockedDsl = htmlSlotDSL(allAttributeDefs, ownGates, attributeKey);
    if (unlockedDsl !== undefined) {
      parseValueAgainstDSL(keywords, unlockedDsl, value);
      continue;
    }
    if (def !== undefined) {
      throw new Error(
        `Attribute Error: Property '${attributeKey}' is not a valid attribute for <${tag}> or the Global configuration registry`,
      );
    }
    const locked = lockedMessageFor(allAttributeDefs, attributeKey, [undefined]);
    if (locked !== null) {
      throw new Error(`Attribute Error: ${locked}`);
    }
    throw new Error(
      `Attribute Error: Property '${attributeKey}' is not a valid attribute for <${tag}> or the Global configuration registry`,
    );
  }

  for (const [attrKey, def] of Object.entries(allAttributeDefs)) {
    const isOptional =
      typeof def === "string"
        ? def.split("|").some((part) => part.trim() === "undefined")
        : isGateDefinition(def)
          ? "undefined" in def
          : false;
    if (!isOptional && !(attrKey in providedAttributes)) {
      throw new Error(
        `Attribute Error: Required attribute '${attrKey}' is missing on <${tag}>`,
      );
    }
  }

  const innerHTML =
    "innerHTML" in record && record["innerHTML"]
      ? record["innerHTML"]
      : undefined;

  const css = record.css;
  if (css !== undefined && css !== null) {
    const classesOf = (node: unknown): string[] => {
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

    // A complex CSS attribute (`display`, `position`, ...) is a *gate*: the
    // value the author writes unlocks further props on the node itself (`self`)
    // and on its direct children (`children`). The shared helpers in
    // `engine/gate-resolution.ts` mirror the type-level gate tables in
    // `engine/types.ts` so the two walls agree, and serve the HTML layer too.

    // The distinct tags in an array of children; used to seed the implicit
    // `display` inside a `> child` block that targets an array. When the
    // children disagree, no single default display applies.
    const tagsOf = (children: unknown[]): string[] => {
      const tags = new Set<string>();
      for (const child of children) {
        if (
          child !== null &&
          typeof child === "object" &&
          !Array.isArray(child)
        ) {
          const childTag = (child as BaseComponentStructure).tag;
          if (typeof childTag === "string") tags.add(childTag);
        }
      }
      return [...tags];
    };

    const validateCSS = (
      block: Record<string, unknown>,
      contextInnerHTML: typeof innerHTML,
      contextClasses: string[],
      cssAttrs: Record<string, any>,
      cssProps: Record<string, any>,
      nodeTag: string | undefined,
      parentGates: Record<string, string>,
      registeredQueries: Set<string>,
      inheritedVars: Record<string, string>,
      inPseudoElement?: boolean,
      parentGridAreas?: string,
    ): void => {
      // Custom properties defined in this scope, layered over the ones
      // inherited from enclosing scopes. CSS custom properties inherit, so a
      // `var()` may reference either. Component-written values shadow the
      // registry; cycle detection walks this map together with it.
      const definedVars: Record<string, string> = { ...inheritedVars };
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
          explicitGates[key] = resolveGateValue(
            mergedKeywords,
            key,
            cssAttrs[key],
            written,
            "CSS",
          );
        }
      }
      const defaultDisplay =
        nodeTag !== undefined && tagConfig[nodeTag] !== undefined
          ? tagConfig[nodeTag].display
          : undefined;
      if (defaultDisplay !== undefined && isGateDefinition(cssAttrs["display"])) {
        selfGates["display"] = defaultDisplay;
      }
      Object.assign(selfGates, explicitGates);

      for (const key of Object.keys(block)) {
        if (key.startsWith("> ")) {
          const childName = key.slice(2);
          if (
            !contextInnerHTML ||
            typeof contextInnerHTML === "string" ||
            !(childName in contextInnerHTML)
          ) {
            throw new Error(
              `CSS Error: Child selector '${key}' references child '${childName}' which is not declared in the element's innerHTML`,
            );
          }
        }
        if (key.startsWith("&.")) {
          if (inPseudoElement) {
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
          // `contextClasses` is the declaring scope's class list: the element
          // itself, or the `> child` target when this block is nested under a
          // child selector. Query blocks pass it through unchanged, so this
          // composes with them exactly as with pseudo-class/element blocks.
          if (!contextClasses.includes(className)) {
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
          if (!registeredQueries.has(key)) {
            throw new Error(
              `CSS Error: Query '${key}' is not registered in the cssQueriesConfig. Registered queries are: ${[...registeredQueries].join(", ")}`,
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
          const nextInPseudoElement = key.startsWith("::") || !!inPseudoElement;
          validateCSS(
            value as Record<string, unknown>,
            contextInnerHTML,
            contextClasses,
            cssAttrs,
            cssProps,
            nodeTag,
            parentGates,
            registeredQueries,
            definedVars,
            nextInPseudoElement,
            parentGridAreas,
          );
          continue;
        }
        if (
          value !== null &&
          typeof value === "object" &&
          !Array.isArray(value)
        ) {
          let nextContext = contextInnerHTML;
          let nextClasses = contextClasses;
          let nextTag = nodeTag;
          if (key.startsWith("> ")) {
            const childName = key.slice(2);
            if (
              contextInnerHTML &&
              typeof contextInnerHTML === "object" &&
              childName in contextInnerHTML
            ) {
              const rawChild = (contextInnerHTML as Record<string, unknown>)[
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
                    ? (merged as typeof innerHTML)
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
                      ] as typeof innerHTML)
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
          const nextInPseudoElement = key.startsWith("::") || !!inPseudoElement;
          // A `> child` block and a `::` pseudo-element block resolve their
          // grid-area against this scope's own grid-template-areas (mirroring
          // CSSParent = CSSValue at the type level); every other nested block
          // passes the enclosing scope's areas through unchanged.
          const nextGridAreas =
            key.startsWith("> ") || key.startsWith("::")
              ? gridAreasOf(block)
              : parentGridAreas;
          validateCSS(
            value as Record<string, unknown>,
            nextContext,
            nextClasses,
            cssAttrs,
            cssProps,
            nextTag,
            // `> child` blocks inherit this scope's EXPLICIT gates for the
            // children slot; pseudo-class / class / pseudo-element blocks pass
            // the parent gates through unchanged.
            key.startsWith("> ") ? explicitGates : parentGates,
            registeredQueries,
            definedVars,
            nextInPseudoElement,
            nextGridAreas,
          );
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
              parseCSSValueAgainstDSL(mergedKeywords, attrDef, value, varContext);
              // `animation-name` / `animation` must reference a registered
              // keyframe. The base DSL above still validates the value's shape;
              // this is the closed-world reference check on top.
              if (
                !referencesRegisteredKeyframe(key, value, cssKeyframesConfig)
              ) {
                throw new Error(
                  animationReferenceError(key, value, cssKeyframesConfig),
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
                mergedKeywords,
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
                mergedKeywords,
                selfDSL,
                value,
                varContext,
              );
            }
            continue;
          }
          const childrenDSL = slotDSL(cssAttrs, parentGates, key, "children");
          if (childrenDSL !== undefined) {
            if (!isKeyword) {
              parseCSSValueAgainstDSL(
                mergedKeywords,
                childrenDSL,
                value,
                varContext,
              );
              // `grid-area` names an area the parent's `grid-template-areas`
              // must define. The DSL above only checks the value's shape
              // (`<custom-ident>` is any string); this is the closed-world
              // cross-reference on top, mirroring the type-level
              // `GridAreaConstraint`.
              if (key === "grid-area" && parentGridAreas !== undefined) {
                const areaNames = parseGridAreaNames(parentGridAreas);
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
    validateCSS(
      css as Record<string, unknown>,
      innerHTML,
      classesOf(record),
      cssAttributesConfig,
      cssPropertiesConfig,
      tag,
      {},
      new Set(cssQueriesConfig),
      {},
    );
  }

  const innerHTMLConfig = tagDefinition.innerHTML;
  const isVoidElement =
    Array.isArray(innerHTMLConfig) && innerHTMLConfig.length === 0;

  if (isVoidElement) {
    if (innerHTML !== undefined) {
      throw new Error(
        `Validation Error: Tag '<${tag}>' is configured as a void element and must not contain any innerHTML or children`,
      );
    }
    return;
  }

  if (innerHTML === undefined) {
    return;
  }

  const isWildcard = innerHTMLConfig === "*";
  const ownList = Array.isArray(innerHTMLConfig) ? innerHTMLConfig : [];
  const declaresText = ownList.includes("#text");
  const allowsText = isWildcard || declaresText;

  let childAllowed: AllowedTagSet;
  let forwardAllowed: AllowedTagSet;
  if (isWildcard) {
    childAllowed = inheritedAllowed;
    forwardAllowed = inheritedAllowed;
  } else if (declaresText) {
    const intersected = intersectAllowed(inheritedAllowed, ownList);
    childAllowed = intersected;
    forwardAllowed = intersected;
  } else {
    childAllowed = new Set(ownList);
    forwardAllowed = inheritedAllowed;
  }

  if (typeof innerHTML === "string") {
    if (!allowsText) {
      throw new Error(
        `Validation Error: Tag '<${tag}>' innerHTML cannot contain a string without the #text`,
      );
    }
    return;
  }

  const processChild = (child: unknown): void => {
    if (typeof child === "string") {
      if (!allowsText) {
        throw new Error(
          `Validation Error: Tag '<${tag}>' innerHTML cannot contain a string without the #text`,
        );
      }
      return;
    }
    if (Array.isArray(child)) {
      for (const item of child) {
        processChild(item);
      }
      return;
    }
    const childTag =
      child !== null && typeof child === "object"
        ? (child as BaseComponentStructure).tag
        : undefined;
    if (
      childAllowed !== null &&
      typeof childTag === "string" &&
      !childAllowed.has(childTag)
    ) {
      throw new Error(
        `Structural Error: '<${childTag}>' is not a permitted child of <${tag}>`,
      );
    }
    validateComponentNode(
      child,
      keywords,
      globalAttributes,
      tagConfig,
      cssAttributesConfig,
      cssPropertiesConfig,
      cssQueriesConfig,
      cssKeyframesConfig,
      forwardAllowed,
      mergedKeywords,
    );
  };

  for (const child of Object.values(innerHTML)) {
    processChild(child);
  }
}

export default function engine<
  const SupportedKeywords extends SupportedKeywordsConfig,
  const HTMLGlobalAttributesConfig extends BaseHTMLAttributesConfig,
  const HTMLTagConfig extends BaseHTMLTagConfig,
  const CSSSyntaxConfig extends BaseCSSSyntaxConfig,
  const CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
  const CSSPseudoClassConfig extends BaseCSSPseudoClassConfig,
  const CSSPropertiesConfig extends BaseCSSPropertiesConfig,
  const CSSQueriesConfig extends readonly string[],
  const CSSKeyframesConfig extends BaseKeyframesConfig = {},
>(
  config: {
    supportedKeywords: SupportedKeywords;
    htmlAttributesConfig: ValidateHTMLAttributesConfig<
      SupportedKeywords,
      HTMLGlobalAttributesConfig
    >;
    htmlTagConfig: ValidateHTMLTagConfig<
      SupportedKeywords,
      CSSAttributesConfig,
      HTMLTagConfig
    >;
    cssSyntaxConfig: ValidateCSSSyntaxConfig<
      SupportedKeywords,
      CSSSyntaxConfig
    >;
    cssAttributesConfig: ValidateCSSAttributesConfig<
      SupportedKeywords,
      CSSSyntaxConfig,
      CSSAttributesConfig
    >;
    cssPseudoClassConfig: CSSPseudoClassConfig;
    // The registry builder (`cssPropertiesConfig`) is where the no-union
    // policy is enforced, and it is the only supported way to build one. The
    // engine trusts that already-validated registry, so it permits unions here
    // rather than re-deciding against the flag it cannot see.
    cssPropertiesConfig: ValidateCSSPropertiesConfig<
      SupportedKeywords,
      CSSSyntaxConfig,
      CSSPropertiesConfig,
      true
    >;
    cssQueriesConfig: CSSQueriesConfig;
    // Registered @keyframes. Optional so a registry that does not animate
    // gains nothing; when present, `animation-name` / `animation` are
    // constrained to the registered names at both walls.
    cssKeyframesConfig?: CSSKeyframesConfig;
  },
  options?: { skipValidation?: boolean },
) {
  const createComponent = <const T extends BaseComponentStructure>(
    componentStructure: ValidateComponentStructure<
      SupportedKeywords,
      HTMLGlobalAttributesConfig,
      HTMLTagConfig,
      CSSSyntaxConfig,
      CSSAttributesConfig,
      CSSPseudoClassConfig,
      CSSPropertiesConfig,
      CSSQueriesConfig,
      CSSKeyframesConfig,
      keyof HTMLTagConfig | "#text",
      T,
      keyof HTMLTagConfig | "#text"
    >,
  ) => {
    if (!options?.skipValidation) {
      const mergedKeywords = Object.assign(
        {},
        config.cssSyntaxConfig,
        config.supportedKeywords,
      );
      validateComponentNode(
        componentStructure,
        config.supportedKeywords,
        config.htmlAttributesConfig,
        config.htmlTagConfig,
        config.cssAttributesConfig,
        config.cssPropertiesConfig,
        config.cssQueriesConfig,
        config.cssKeyframesConfig ?? {},
        null,
        mergedKeywords,
      );
    }
    return componentStructure as T;
  };

  const renderComponentBound = <const T extends BaseComponentStructure>(
    componentStructure: T,
  ) => {
    return renderComponent(
      config.htmlTagConfig,
      componentStructure,
      config.htmlAttributesConfig,
      Object.assign(
        {},
        config.cssSyntaxConfig,
        config.supportedKeywords,
      ),
      config.cssKeyframesConfig ?? {},
    );
  };

  return {
    createComponent: createComponent,
    renderComponent: renderComponentBound,
    cssProperties: renderCSSPropertiesConfig(config.cssPropertiesConfig),
  };
}
