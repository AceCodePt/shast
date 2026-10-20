import { dslString, type SupportedKeywordsConfig } from "tsyntax";
import type {
  BaseHTMLAttributesConfig,
  BaseHTMLAttributeComplexValue,
  HTMLAttributeArms,
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

// Validate one attribute value: an array of arms, or the legacy bare DSL string
// a tag config still authors until html-tag-config-array-only. Every arm is
// validated on its own, so an arm's internal `|` is never re-split.
const validateAttributeValue = (
  supportedKeywords: SupportedKeywordsConfig,
  value: unknown,
): void => {
  if (typeof value === "string") {
    dslString(supportedKeywords, value);
    return;
  }
  if (Array.isArray(value)) {
    for (const arm of value) {
      dslString(supportedKeywords, arm);
    }
  }
};

// Walks an attributes config, validating every DSL arm it contains - including
// the bags of each complex value and any pattern key. Shared by
// `htmlAttributeConfig` (global attributes) and `htmlTagConfig` (per-tag
// attributes) so both walls parse the same strings.
export const validateHTMLAttributes = (
  supportedKeywords: SupportedKeywordsConfig,
  config: Record<string, unknown>,
): void => {
  for (const key in config) {
    const value = config[key];
    if (typeof value === "string" || Array.isArray(value)) {
      validateAttributeValue(supportedKeywords, value);
      continue;
    }
    if (!isComplex(value)) {
      continue;
    }
    for (const subKey in value) {
      if (isPatternKey(subKey)) {
        try {
          dslString(supportedKeywords, subKey);
        } catch {
          throw new Error(
            `Invalid pattern key \`${subKey}\` for gate \`${key}\`: not a valid DSL`,
          );
        }
      }
      const bag = value[subKey];
      if (!isComplex(bag)) continue;
      for (const attribute in bag) {
        validateAttributeValue(supportedKeywords, bag[attribute]);
      }
    }
  }
};

// Validate every arm and join them into the one `' | '`-joined DSL string the
// engine reads. The authoring surface uses arrays; the runtime surface - and
// everything downstream of `htmlAttributeConfig` - only ever sees strings.
const joinAttributeArms = (
  supportedKeywords: SupportedKeywordsConfig,
  arms: HTMLAttributeArms,
): string => {
  if (!Array.isArray(arms) || arms.length === 0) {
    throw new Error(`An HTML attribute must declare at least one arm`);
  }
  for (const arm of arms) {
    dslString(supportedKeywords, arm);
  }
  return arms.join(" | ");
};

const normaliseAttributeBag = (
  supportedKeywords: SupportedKeywordsConfig,
  bag: Record<string, HTMLAttributeArms>,
): Record<string, string> => {
  const normalised: Record<string, string> = {};
  for (const attribute in bag) {
    const arms = bag[attribute];
    if (arms === undefined) continue;
    normalised[attribute] = joinAttributeArms(supportedKeywords, arms);
  }
  return normalised;
};

// Normalise an authored attribute config to the runtime shape: every arm array
// is joined with `' | '`, so the engine's optional-attribute detection reads
// the same joined string it always has. Exported so `htmlTagConfig` can
// normalise each tag's attribute bag at its own boundary.
export const normalizeHTMLAttributesConfig = (
  supportedKeywords: SupportedKeywordsConfig,
  config: Record<string, unknown>,
): Record<string, unknown> => {
  const raw = config as BaseHTMLAttributesConfig;
  const normalised: Record<string, unknown> = {};
  for (const key in raw) {
    const value = raw[key];
    if (value === undefined) continue;
    if (typeof value === "string") {
      // Legacy bare DSL string: nothing to join.
      normalised[key] = value;
    } else if (Array.isArray(value)) {
      normalised[key] = joinAttributeArms(supportedKeywords, value);
    } else {
      const gate = value as BaseHTMLAttributeComplexValue;
      for (const subKey in gate) {
        if (isPatternKey(subKey)) {
          try {
            dslString(supportedKeywords, subKey);
          } catch {
            throw new Error(
              `Invalid pattern key \`${subKey}\` for gate \`${key}\`: not a valid DSL`,
            );
          }
        }
      }
      const variants: Record<string, unknown> = {};
      for (const subKey in gate) {
        variants[subKey] = normaliseAttributeBag(
          supportedKeywords,
          gate[subKey]!,
        );
      }
      normalised[key] = variants;
    }
  }
  return normalised;
};

export const htmlAttributeConfig = <
  const Keywords extends SupportedKeywordsConfig,
  const A extends BaseHTMLAttributesConfig,
>(
  supportedKeywords: Keywords,
  config: ValidateHTMLAttributesConfig<Keywords, A>,
) => {
  return normalizeHTMLAttributesConfig(
    supportedKeywords,
    config as Record<string, unknown>,
  ) as A;
};
