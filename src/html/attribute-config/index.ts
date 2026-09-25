import { dslString, type SupportedKeywordsConfig } from "tsyntax";
import type {
  BaseHTMLAttributesConfig,
  BaseHTMLAttributeComplexValue,
  ValidateHTMLAttributesConfig,
} from "./types.ts";

const isComplex = (value: unknown): value is BaseHTMLAttributeComplexValue =>
  value !== null && typeof value === "object" && !Array.isArray(value);

// A value key of a complex attribute is a *pattern* when it is written as a
// DSL string (a `<token>` or a backtick template). A literal key such as
// `checkbox` is a plain name and must not be parsed as DSL.
const isPatternKey = (key: string): boolean =>
  (key.startsWith("<") && key.endsWith(">")) ||
  (key.startsWith("`") && key.endsWith("`"));

// Walks an attributes config, validating every DSL string it contains -
// including the `self` / `children` bags of complex values and any pattern
// key. Shared by `htmlAttributeConfig` (global attributes) and `htmlTagConfig`
// (per-tag attributes) so both walls parse the same strings.
export const validateHTMLAttributes = (
  supportedKeywords: SupportedKeywordsConfig,
  config: Record<string, unknown>,
): void => {
  for (const key in config) {
    const value = config[key];
    if (typeof value === "string") {
      dslString(supportedKeywords, value);
      continue;
    }
    if (!isComplex(value)) {
      continue;
    }
    for (const subKey in value) {
      if (isPatternKey(subKey)) {
        dslString(supportedKeywords, subKey);
      }
      const slot = value[subKey];
      if (!slot) continue;
      for (const attribute in slot.self) {
        const inner = slot.self[attribute];
        if (inner !== undefined) dslString(supportedKeywords, inner);
      }
      for (const attribute in slot.children) {
        const inner = slot.children[attribute];
        if (inner !== undefined) dslString(supportedKeywords, inner);
      }
    }
  }
};

export const htmlAttributeConfig = <
  const Keywords extends SupportedKeywordsConfig,
  const A extends BaseHTMLAttributesConfig,
>(
  supportedKeywords: Keywords,
  config: ValidateHTMLAttributesConfig<Keywords, A>,
) => {
  validateHTMLAttributes(supportedKeywords, config);
  return config as A;
};
