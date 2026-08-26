import {
  dslString,
  detectCircularReferences,
  type SupportedKeywordsConfig,
} from "tsyntax";
import type { BaseCSSSyntaxConfig, ValidateCSSSyntaxConfig } from "./types.ts";

export function cssSyntaxConfig<
  const Keywords extends SupportedKeywordsConfig,
  const T extends BaseCSSSyntaxConfig,
>(supportedKeywords: Keywords, config: ValidateCSSSyntaxConfig<Keywords, T>) {
  for (const key in config) {
    if (!/^<.+>$/.test(key)) {
      throw new Error(`The key ${key} should start and end with <>`);
    }
    const item = config[key];
    dslString(Object.assign({}, supportedKeywords, config), item);
  }

  detectCircularReferences(config);

  return config as T;
}
