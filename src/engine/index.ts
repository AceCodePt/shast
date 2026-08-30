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
import {
  parseValueAgainstDSL,
  type SupportedKeywordsConfig,
} from "tsyntax";
import type {
  BaseHTMLAttributesConfig,
  InferHTMLAttributesConfig,
  ValidateHTMLAttributesConfig,
} from "@/html/attribute-config/types.ts";
import type {
  BaseHTMLTagConfig,
  ValidateHTMLTagConfig,
} from "@/html/tag-config/types.ts";
import { renderCSSPropertiesConfig } from "@/engine/render/properties-config.ts";
import { renderComponent } from "@/engine/render/render-component.ts";
import { CSS_IDENTIFIER_REGEX as CSS_CLASS_NAME } from "@/css/ident.ts";
import type { MakeUndefinedOptional } from "@/types.ts";
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

export function validateComponentNode(
  node: unknown,
  keywords: SupportedKeywordsConfig,
  globalAttributes: BaseHTMLAttributesConfig,
  tagConfig: BaseHTMLTagConfig,
  cssAttributesConfig: Record<string, any>,
  cssPropertiesConfig: Record<string, any>,
  cssQueriesConfig: readonly string[],
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
  if (attributes !== undefined && attributes !== null) {
    const tagAttributes = tagDefinition.attributes ?? {};
    for (const [attributeKey, value] of Object.entries(attributes)) {
      const dsl = tagAttributes[attributeKey] ?? globalAttributes[attributeKey];
      if (dsl === undefined) {
        throw new Error(
          `Attribute Error: Property '${attributeKey}' is not a valid attribute for <${tag}> or the Global configuration registry`,
        );
      }
      parseValueAgainstDSL(keywords, dsl, value);
    }
  }

  const providedAttributes = attributes ?? {};
  const allAttributeDefs = {
    ...globalAttributes,
    ...(tagDefinition.attributes ?? {}),
  };
  for (const [attrKey, dsl] of Object.entries(allAttributeDefs)) {
    if (typeof dsl !== "string") continue;
    const isOptional = dsl
      .split("|")
      .some((part) => part.trim() === "undefined");
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
        ? classValue.split(/\s+/)
        : [];
    };

    // A complex CSS attribute (`display`, `position`, ...) is a *gate*: the
    // value the author writes unlocks further props on the node itself (`self`)
    // and on its direct children (`children`). These helpers mirror the
    // type-level gate tables in `engine/types.ts` so the two walls agree.
    const isGate = (def: unknown): def is Record<string, any> =>
      def !== null && typeof def === "object" && !Array.isArray(def);

    const gateNames = (cssAttrs: Record<string, any>): string[] =>
      Object.keys(cssAttrs).filter((key) => isGate(cssAttrs[key]));

    // Resolve the value a gate was written with to its key: a literal
    // (`"flex"`) or a DSL pattern key (`"<length>"`).
    const resolveGateValue = (
      cssAttrs: Record<string, any>,
      gate: string,
      writtenValue: unknown,
    ): string => {
      const gateDef = cssAttrs[gate];
      if (typeof writtenValue !== "string") {
        throw new Error(
          `CSS Error: Invalid value type for '${gate}'. Expected a string`,
        );
      }
      if (writtenValue in gateDef) return writtenValue;
      for (const valueKey of Object.keys(gateDef)) {
        if (valueKey.startsWith("<") && valueKey.endsWith(">")) {
          try {
            parseValueAgainstDSL(mergedKeywords, valueKey, writtenValue);
            return valueKey;
          } catch {}
        }
      }
      throw new Error(
        `CSS Error: Invalid value '${String(writtenValue)}' for '${gate}'. Expected one of: ${Object.keys(gateDef).join(", ")}`,
      );
    };

    // The values of `gate` that unlock `prop` in `slot`.
    const valuesUnlocking = (
      cssAttrs: Record<string, any>,
      gate: string,
      prop: string,
      slot: "self" | "children",
    ): string[] => {
      const gateDef = cssAttrs[gate];
      if (!isGate(gateDef)) return [];
      const values: string[] = [];
      for (const valueKey of Object.keys(gateDef)) {
        const bag = gateDef[valueKey]?.[slot];
        if (isGate(bag) && prop in bag) {
          values.push(valueKey);
        }
      }
      return values;
    };

    // One clause per gate that can unlock `prop`, matching the type-level
    // `UnlockedBy`: `display: flex | inline-flex` (self) or
    // `display: flex | inline-flex on the parent` (children).
    const unlockedByClauses = (
      cssAttrs: Record<string, any>,
      prop: string,
    ): string[] => {
      const clauses: string[] = [];
      for (const gate of gateNames(cssAttrs)) {
        const selfValues = valuesUnlocking(cssAttrs, gate, prop, "self");
        if (selfValues.length > 0) {
          clauses.push(`${gate}: ${selfValues.join(" | ")}`);
        }
        const childrenValues = valuesUnlocking(cssAttrs, gate, prop, "children");
        if (childrenValues.length > 0) {
          clauses.push(`${gate}: ${childrenValues.join(" | ")} on the parent`);
        }
      }
      return clauses;
    };

    // `'gap' requires display: flex | grid | inline-flex | inline-grid`, or
    // `null` when no gate can unlock `prop` (i.e. it is truly unknown).
    const lockedMessageFor = (
      cssAttrs: Record<string, any>,
      prop: string,
    ): string | null => {
      const clauses = unlockedByClauses(cssAttrs, prop);
      return clauses.length > 0
        ? `'${prop}' requires ${clauses.join(", or ")}`
        : null;
    };

    // The DSL for `prop` under the gate values in `gates` for `slot`, if the
    // written gate value unlocks it.
    const slotDSL = (
      cssAttrs: Record<string, any>,
      gates: Record<string, string>,
      prop: string,
      slot: "self" | "children",
    ): string | undefined => {
      for (const gate of Object.keys(gates)) {
        const matchedValue = gates[gate];
        if (matchedValue === undefined) continue;
        const bag = cssAttrs[gate]?.[matchedValue]?.[slot];
        if (isGate(bag) && prop in bag) {
          return bag[prop];
        }
      }
      return undefined;
    };

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
      inPseudoElement?: boolean,
    ): void => {
      // Gates the author wrote in this scope, in any order, plus the tag's
      // default `display` when they did not write one (implicit display).
      const explicitGates: Record<string, string> = {};
      const selfGates: Record<string, string> = {};

      for (const key of Object.keys(block)) {
        if (key.startsWith("> ") || key.startsWith("&.")) continue;
        if (isGate(cssAttrs[key])) {
          explicitGates[key] = resolveGateValue(cssAttrs, key, block[key]);
        }
      }
      const defaultDisplay =
        nodeTag !== undefined && tagConfig[nodeTag] !== undefined
          ? tagConfig[nodeTag].display
          : undefined;
      if (defaultDisplay !== undefined && isGate(cssAttrs["display"])) {
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
            nextInPseudoElement,
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
            nextInPseudoElement,
          );
        } else if (!key.startsWith("> ") && !key.startsWith("&.")) {
          const attrDef = cssAttrs[key];
          const propDef = cssProps[key];

          if (typeof attrDef === "string") {
            parseValueAgainstDSL(mergedKeywords, attrDef, value as any);
            continue;
          }
          if (isGate(attrDef)) {
            continue; // gate already resolved (and validated) in the pre-pass
          }
          if (propDef !== undefined) {
            if (typeof propDef === "object" && typeof propDef.syntax === "string") {
              parseValueAgainstDSL(mergedKeywords, propDef.syntax, value as any);
            }
            continue;
          }
          const selfDSL = slotDSL(cssAttrs, selfGates, key, "self");
          if (selfDSL !== undefined) {
            parseValueAgainstDSL(mergedKeywords, selfDSL, value as any);
            continue;
          }
          const childrenDSL = slotDSL(cssAttrs, parentGates, key, "children");
          if (childrenDSL !== undefined) {
            parseValueAgainstDSL(mergedKeywords, childrenDSL, value as any);
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
    cssPropertiesConfig: ValidateCSSPropertiesConfig<
      SupportedKeywords,
      CSSSyntaxConfig,
      CSSPropertiesConfig
    >;
    cssQueriesConfig: CSSQueriesConfig;
  },
  options?: { skipValidation?: boolean },
) {
  const createComponent = <const T extends BaseComponentStructure>(
    componentStructure: ValidateComponentStructure<
      SupportedKeywords,
      MakeUndefinedOptional<
        InferHTMLAttributesConfig<SupportedKeywords, HTMLGlobalAttributesConfig>
      >,
      HTMLTagConfig,
      CSSSyntaxConfig,
      CSSAttributesConfig,
      CSSPseudoClassConfig,
      CSSPropertiesConfig,
      CSSQueriesConfig,
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
        null,
        mergedKeywords,
      );
    }
    return componentStructure as T;
  };

  const renderComponentBound = <const T extends BaseComponentStructure>(
    componentStructure: T,
  ) => {
    return renderComponent(config.htmlTagConfig, componentStructure);
  };

  return {
    createComponent: createComponent,
    renderComponent: renderComponentBound,
    cssProperties: renderCSSPropertiesConfig(config.cssPropertiesConfig),
  };
}
