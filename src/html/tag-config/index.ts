import type { BaseCSSAttributesComplexConfig } from "@/css/attribute-config/types.ts";
import type { BaseHTMLTagConfig, ValidateHTMLTagConfig } from "./types.ts";
import type { SupportedKeywordsConfig } from "tsyntax";
import { normalizeHTMLAttributesConfig } from "@/html/attribute-config/index.ts";

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

  const normalised: Record<string, unknown> = {};

  for (const tag in config) {
    if (!displays.has(String(config[tag].display))) {
      throw new Error("The tag isn't one of the allowed displays");
    }

    // Join each tag's attribute arms into the one `' | '`-joined DSL string the
    // engine reads. This validates every arm and every pattern key on the way.
    const attributes = normalizeHTMLAttributesConfig(
      supportedKeywords,
      config[tag].attributes as unknown as Record<string, unknown>,
    );

    const innerHTML = config[tag].innerHTML;
    if (!("all" in innerHTML && innerHTML.all)) {
      for (const innerTag of innerHTML.include) {
        if (innerTag === "#text") {
          continue;
        }
        if (!keys.includes(innerTag)) {
          throw new Error(`The tag isn't included`);
        }
      }
    }

    normalised[tag] = { ...config[tag], attributes };
  }

  return normalised as T;
};
