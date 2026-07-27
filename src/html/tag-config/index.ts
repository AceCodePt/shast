import type { BaseCSSAttributesComplexConfig } from "@/css/attribute-config/types.ts";
import type { BaseHTMLTagConfig, ValidateHTMLTagConfig } from "./types.ts";
import { dslString, type SupportedKeywordsConfig } from "@/dsl/index.ts";

export const htmlTagConfig = <
  const Keywords extends SupportedKeywordsConfig,
  const CSSAttributesConfig extends BaseCSSAttributesComplexConfig & {
    display: { [attr: string]: any };
  },
  const T extends BaseHTMLTagConfig,
>(
  supportedKeywords: Keywords,
  cssAttributesConfig: CSSAttributesConfig,
  config: ValidateHTMLTagConfig<Keywords, CSSAttributesConfig, T>,
) => {
  const keys = Object.keys(config);
  const displays = new Set(Object.keys(cssAttributesConfig.display));

  for (const tag in config) {
    if (!displays.has(String(config[tag].display))) {
      throw new Error("The tag isn't one of the allowed displays");
    }
    const attributes = config[tag].attributes;
    for (const attributeKey in attributes) {
      const attribute = attributes[attributeKey];
      if (attribute) {
        dslString(supportedKeywords, attribute);
      }
    }

    const innerHTML = config[tag].innerHTML;
    if (typeof innerHTML === "string") {
      continue;
    }
    for (const innerTag of innerHTML) {
      if (innerTag === "#text") {
        continue;
      }
      if (!keys.includes(innerTag)) {
        throw new Error(`The tag isn't included`);
      }
    }
  }

  return config as T;
};
