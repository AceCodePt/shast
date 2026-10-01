import type { BaseCSSAttributesComplexConfig } from "@/css/attribute-config/types.ts";
import type {
  BaseHTMLAttributesConfig,
  ValidateHTMLAttributesConfig,
} from "@/html/attribute-config/types.ts";
import type { SupportedKeywordsConfig } from "tsyntax";

// A tag's attributes are the same array-armed DSL shape as the global HTML
// attribute config: each attribute name maps either to its arms or to a complex
// value whose value keys unlock sibling attributes on the same element. Sharing
// the attribute-config types means both walls validate every arm with the same
// `DSLValidateArm` rule and `htmlTagConfig` normalises them the same way.
export type BaseHTMLTagAttributesConfig = BaseHTMLAttributesConfig;

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
        attributes: ValidateHTMLAttributesConfig<
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
