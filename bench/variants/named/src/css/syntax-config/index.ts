import {
  dslString,
  detectCircularReferences,
  type SupportedKeywordsConfig,
} from "tsyntax";
import type {
  BaseCSSSyntaxConfig,
  CSSSyntaxKeywordsConfig,
  ValidateCSSSyntaxConfig,
} from "./types.ts";

export function cssSyntaxConfig<
  const Keywords extends SupportedKeywordsConfig,
  const T extends BaseCSSSyntaxConfig,
>(
  supportedKeywords: Keywords,
  config: ValidateCSSSyntaxConfig<Keywords, T>,
): CSSSyntaxKeywordsConfig<T> {
  const joined: Record<string, string> = {};

  for (const key in config) {
    if (!/^<.+>$/.test(key)) {
      throw new Error(`The key ${key} should start and end with <>`);
    }
    const arms = config[key];
    if (!Array.isArray(arms) || arms.length === 0) {
      throw new Error(`The token ${key} must declare at least one arm`);
    }
    joined[key] = arms.join(" | ");
  }

  // Validate every arm against the fully-joined map, so a token may reference
  // one declared later in the object. `dslString` only checks that a referenced
  // token exists, never recurses into it.
  const merged = Object.assign({}, supportedKeywords, joined);
  for (const key in joined) {
    dslString(merged, joined[key]!);
  }

  detectCircularReferences(joined);

  return joined as CSSSyntaxKeywordsConfig<T>;
}

// lsp-touch
