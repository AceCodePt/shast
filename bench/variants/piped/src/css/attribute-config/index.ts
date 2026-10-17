import { dslString, type SupportedKeywordsConfig } from "tsyntax";
import type {
  BaseCSSAttributesComplexConfig,
  BaseCSSAttributeComplexValue,
  CSSAttributeArms,
  ValidateCSSAttributesConfig,
} from "./types.ts";
import type { CSSSyntaxKeywords } from "@/css/syntax-config/types.ts";
import { isPatternKey } from "@/engine/gate-resolution.ts";

// Validate the one `' | '`-joined DSL string the engine reads. The piped
// variant authors that string directly, so there is nothing to join.
function validateAttributeArms(
  allKeywords: SupportedKeywordsConfig,
  arms: CSSAttributeArms,
): string {
  if (typeof arms !== "string" || arms === "") {
    throw new Error(`A CSS attribute must declare at least one arm`);
  }
  dslString(allKeywords, arms);
  return arms;
}

function normaliseAttributeBag(
  allKeywords: SupportedKeywordsConfig,
  bag: Record<string, CSSAttributeArms>,
): Record<string, string> {
  const normalised: Record<string, string> = {};
  for (const attribute in bag) {
    const arms = bag[attribute];
    if (arms === undefined) continue;
    normalised[attribute] = validateAttributeArms(allKeywords, arms);
  }
  return normalised;
}

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
  const raw = config as BaseCSSAttributesComplexConfig;
  const normalised: Record<string, unknown> = {};
  for (const key in raw) {
    const value = raw[key];
    if (value === undefined) continue;
    if (typeof value === "string") {
      normalised[key] = validateAttributeArms(allKeywords, value);
    } else {
      const gate = value as BaseCSSAttributeComplexValue;
      for (const subKey in gate) {
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
      const variants: Record<string, unknown> = {};
      for (const subKey in gate) {
        const variant = gate[subKey]!;
        variants[subKey] = {
          self: normaliseAttributeBag(allKeywords, variant.self),
          children: normaliseAttributeBag(allKeywords, variant.children),
        };
      }
      normalised[key] = variants;
    }
  }
  return normalised as A;
};
