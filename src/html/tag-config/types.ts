import type { BaseCSSAttributesComplexConfig } from "@/css/attribute-config/types.ts";
import type { DSLValidate, SupportedKeywordsConfig } from "tsyntax";

// Tag attributes are still authored as bare DSL strings. The array-only
// `BaseHTMLAttributesConfig` is not usable here yet: a tag's attributes are read
// as strings at runtime and are only normalised at the `htmlTagConfig` boundary
// in `html-tag-config-array-only`. Until then this mirrors the pre-array HTML
// attribute shape, and `engine/types.ts` lifts it to the array surface with
// `HTMLArmsConfig`.
export interface BaseHTMLTagAttributeSimpleConfig {
  [attribute: string]: string;
}
export interface BaseHTMLTagAttributeComplexValue {
  [value: string]: BaseHTMLTagAttributeSimpleConfig;
}
export interface BaseHTMLTagAttributesConfig {
  [attribute: string]: BaseHTMLTagAttributeComplexValue | string;
}

type ValidateHTMLTagAttributeSimpleConfig<
  Keywords extends SupportedKeywordsConfig,
  A extends BaseHTMLTagAttributeSimpleConfig,
> = keyof A extends string
  ? {
      [K in keyof A]: DSLValidate<Keywords, A[K]>;
    }
  : A;

type ValidateHTMLTagAttributesConfig<
  Keywords extends SupportedKeywordsConfig,
  T extends BaseHTMLTagAttributesConfig,
> = keyof T extends string
  ? {
      [K in keyof T]: T[K] extends string
        ? DSLValidate<Keywords, T[K]>
        : T[K] extends BaseHTMLTagAttributeComplexValue
          ? {
              [V in keyof T[K]]: ValidateHTMLTagAttributeSimpleConfig<
                Keywords,
                T[K][V]
              >;
            }
          : never;
    }
  : T;

export interface BaseHTMLTagConfig {
  [tag: string]: {
    display: string;
    attributes: BaseHTMLTagAttributesConfig;
    innerHTML:
      | { all: true; include?: never }
      | { all?: never; include: string[] };
    cssPseudoClass: `:${string}${string}`[];
    cssPseudoElement: `::${string}${string}`[];
  };
}

export type ValidateHTMLTagConfig<
  Keywords extends SupportedKeywordsConfig,
  CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
  TagDefinition extends BaseHTMLTagConfig,
> = keyof TagDefinition extends string
  ? {
      [Tag in keyof TagDefinition]: {
        display: keyof CSSAttributesConfig["display"] & string;
        attributes: ValidateHTMLTagAttributesConfig<
          Keywords,
          TagDefinition[Tag]["attributes"]
        >;
        innerHTML:
          | { all: true; include?: never }
          | { all?: never; include: (keyof TagDefinition | "#text")[] };
        cssPseudoClass: `:${string}${string}`[];
        cssPseudoElement: `::${string}${string}`[];
      };
    }
  : TagDefinition;
