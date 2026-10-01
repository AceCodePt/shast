import { dslString, type SupportedKeywordsConfig } from "tsyntax";
import type {
  BaseCSSAttributesComplexConfig,
  ValidateCSSAttributesConfig,
} from "./types.ts";
import type { CSSSyntaxKeywords } from "@/css/syntax-config/types.ts";
import { isPatternKey } from "@/engine/gate-resolution.ts";

export const cssAttributeConfig = <
  const Keywords extends SupportedKeywordsConfig,
  const S extends CSSSyntaxKeywords,
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
        if (isPatternKey(subKey)) {
          try {
            dslString(allKeywords, subKey);
          } catch {
            throw new Error(
              `Invalid pattern key \`${subKey}\` for gate \`${key}\`: not a valid DSL`,
            );
          }
        }
      }
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
