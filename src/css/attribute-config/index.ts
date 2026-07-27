import { dslString, type SupportedKeywordsConfig } from "@/dsl/index.ts";
import type {
  BaseCSSAttributesComplexConfig,
  ValidateCSSAttributesConfig,
} from "./types.ts";
import type { BaseCSSSyntaxConfig } from "@/css/syntax-config/types.ts";

export const cssAttributeConfig = <
  const Keywords extends SupportedKeywordsConfig,
  const S extends BaseCSSSyntaxConfig,
  const A extends BaseCSSAttributesComplexConfig,
>(
  keywords: Keywords,
  syntaxConfig: S,
  config: ValidateCSSAttributesConfig<Keywords, S, A>,
) => {
  const allKeywords = Object.assign({}, syntaxConfig, keywords);
  for (const key in config) {
    const value = config[key];
    if (typeof value === "string") {
      dslString(allKeywords, value);
    } else if (typeof value === "object") {
      for (const subKey in value) {
        for (const attribute in value[subKey].self) {
          const innerValue = value[subKey]!.self[attribute];
          if (innerValue) {
            dslString(allKeywords, innerValue);
          }
        }
        for (const attribute in value[subKey]!.children) {
          const innerValue = value[subKey]!.children[attribute];
          if (innerValue) {
            dslString(allKeywords, innerValue);
          }
        }
      }
    }
  }
  return config as A;
};
