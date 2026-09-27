import {
  dslString,
  parseValueAgainstDSL,
  type SupportedKeywordsConfig,
} from "tsyntax";
import type { BaseCSSSyntaxConfig } from "@/css/syntax-config/types.ts";
import type {
  BaseCSSPropertiesConfig,
  CSSPropertiesConfigOptions,
  ValidateCSSPropertiesConfig,
} from "./types.ts";
import { assertNoVarCycles } from "@/css/var.ts";

export const cssPropertiesConfig = <
  const K extends SupportedKeywordsConfig,
  const S extends BaseCSSSyntaxConfig,
  const P extends BaseCSSPropertiesConfig,
  const AllowUnions extends boolean = false,
>(
  keywords: K,
  syntaxConfig: S,
  config: ValidateCSSPropertiesConfig<K, S, P, AllowUnions>,
  options?: CSSPropertiesConfigOptions<AllowUnions>,
) => {
  const entries = config;
  const mergedConfig = Object.assign({}, syntaxConfig, keywords);
  const allowUnions = options?.allowUnions === true;

  for (const key in entries) {
    if (!key.startsWith("--")) {
      throw new Error(
        `You must have the property start with -- instead like --${key}`,
      );
    }
    const entry = entries[key];
    if (typeof entry === "object" && typeof entry.syntax === "string") {
      // A registered `syntax` has no string interpolation, so a `|` is always a
      // union separator. Reject it by default; `allowUnions: true` opts out.
      if (!allowUnions && entry.syntax.includes("|")) {
        throw new Error(
          `Property "${key}" declares syntax "${entry.syntax}" with a union ("|"). ` +
            `A union operand cannot be classified; register two properties, or ` +
            `pass { allowUnions: true } to cssPropertiesConfig to permit it.`,
        );
      }

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
  );

  return config as P;
};
