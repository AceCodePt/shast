import {
  dslString,
  parseValueAgainstDSL,
  type SupportedKeywordsConfig,
} from "tsyntax";
import type { BaseCSSSyntaxConfig } from "@/css/syntax-config/types.ts";
import type {
  BaseCSSPropertiesConfig,
  ValidateCSSPropertiesConfig,
} from "./types.ts";
import { assertNoVarCycles } from "@/css/var.ts";

export const cssPropertiesConfig = <
  const K extends SupportedKeywordsConfig,
  const S extends BaseCSSSyntaxConfig,
  const P extends BaseCSSPropertiesConfig,
>(
  keywords: K,
  syntaxConfig: S,
  config: ValidateCSSPropertiesConfig<K, S, P>,
) => {
  const entries = config;
  const mergedConfig = Object.assign({}, syntaxConfig, keywords);

  for (const key in entries) {
    if (!key.startsWith("--")) {
      throw new Error(
        `You must have the property start with -- instead like --${key}`,
      );
    }
    const entry = entries[key];
    if (typeof entry === "object" && typeof entry.syntax === "string") {
      dslString(mergedConfig, entry.syntax);

      if (entry["initial-value"] === undefined) {
        throw new Error(`initial-value is required for property "${key}"`);
      }

      parseValueAgainstDSL(mergedConfig, entry.syntax, entry["initial-value"]);
    }
  }

  // A `var()` in an initial-value can chain into another property; a cycle
  // would never terminate, so reject it where the registry is declared.
  assertNoVarCycles(
    entries as Record<
      string,
      { syntax: string; inherits: boolean; "initial-value": string }
    >,
    mergedConfig,
  );

  return config as P;
};
