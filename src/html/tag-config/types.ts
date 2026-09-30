import type { BaseCSSAttributesComplexConfig } from "@/css/attribute-config/types.ts";
import type { SupportedKeywordsConfig } from "tsyntax";
import type {
  BaseHTMLAttributesConfig,
  ValidateHTMLAttributesConfig,
} from "@/html/attribute-config/types.ts";

export interface BaseHTMLTagConfig {
  [tag: string]: {
    display: string;
    attributes: BaseHTMLAttributesConfig;
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
