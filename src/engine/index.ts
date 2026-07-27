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
} from "@/dsl/index.ts";
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
const CSS_CLASS_NAME = /^-?[_a-zA-Z\u00A0-\uFFFF][_a-zA-Z0-9\u00A0-\uFFFF-]*$/;

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
    const validateCSS = (
      block: Record<string, unknown>,
      contextInnerHTML: typeof innerHTML,
      contextClasses: string[],
      cssAttrs: Record<string, any>,
      cssProps: Record<string, any>,
    ): void => {
      const complexValues: Record<string, string> = {};

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
          const className = key.slice(2);
          if (!CSS_CLASS_NAME.test(className)) {
            throw new Error(
              `CSS Error: Class selector '${key}' has an invalid class name '${className}'`,
            );
          }
        }
        const value = block[key];
        if (
          value !== null &&
          typeof value === "object" &&
          !Array.isArray(value)
        ) {
          let nextContext = contextInnerHTML;
          let nextClasses = contextClasses;
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
              } else {
                nextContext = undefined;
                nextClasses = [];
              }
            }
          }
          validateCSS(
            value as Record<string, unknown>,
            nextContext,
            nextClasses,
            cssAttrs,
            cssProps,
          );
        } else if (!key.startsWith("> ") && !key.startsWith("&.")) {
          const attrDef = cssAttrs[key];
          const propDef = cssProps[key];

          if (typeof attrDef === "string") {
            parseValueAgainstDSL(mergedKeywords, attrDef, value as any);
          } else if (typeof attrDef === "object" && attrDef !== null) {
            if (typeof value !== "string") {
              throw new Error(
                `CSS Error: Invalid value type for '${key}'. Expected a string`,
              );
            }
            const valueKeys = Object.keys(attrDef);
            let matchedKey: string | undefined;
            if (value in attrDef) {
              matchedKey = value;
            } else {
              for (const vk of valueKeys) {
                if (vk.startsWith("<") && vk.endsWith(">")) {
                  try {
                    parseValueAgainstDSL(mergedKeywords, vk, value);
                    matchedKey = vk;
                    break;
                  } catch {}
                }
              }
            }
            if (matchedKey === undefined) {
              throw new Error(
                `CSS Error: Invalid value '${String(value)}' for '${key}'. Expected one of: ${valueKeys.join(", ")}`,
              );
            }
            complexValues[key] = matchedKey;
          } else if (propDef !== undefined) {
            if (typeof propDef === "object" && typeof propDef.syntax === "string") {
              parseValueAgainstDSL(mergedKeywords, propDef.syntax, value as any);
            }
          } else {
            let found = false;
            for (const [attrName, valueKey] of Object.entries(complexValues)) {
              const complexDef = cssAttrs[attrName];
              if (complexDef && typeof complexDef === "object" && valueKey in complexDef) {
                const valueDef = complexDef[valueKey];
                if (valueDef && typeof valueDef === "object" && valueDef.self && key in valueDef.self) {
                  parseValueAgainstDSL(mergedKeywords, valueDef.self[key], value as any);
                  found = true;
                  break;
                }
              }
            }
            if (!found) {
              throw new Error(
                `CSS Error: '${key}' is not a recognized CSS attribute or property`,
              );
            }
          }
        }
      }
    };
    validateCSS(css as Record<string, unknown>, innerHTML, classesOf(record), cssAttributesConfig, cssPropertiesConfig);
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
