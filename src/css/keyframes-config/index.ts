import {
  SUPPORTED_KEYWORDS,
  parseValueAgainstDSL,
  type SupportedKeywords,
  type SupportedKeywordsConfig,
} from "tsyntax";
import type { BaseCSSAttributesComplexConfig } from "@/css/attribute-config/types.ts";
import type { BaseCSSSyntaxConfig } from "@/css/syntax-config/types.ts";
import { CSS_IDENTIFIER_REGEX as KEYFRAME_NAME } from "@/css/ident.ts";
import type {
  BaseKeyframesConfig,
  ValidateKeyframesConfig,
} from "./types.ts";
import { KEYFRAME_SELECTOR_ALIASES } from "./types.ts";

const PERCENTAGE_SELECTOR = /^\d+(?:\.\d+)?%$/;

const isGate = (def: unknown): def is Record<string, any> =>
  def !== null && typeof def === "object" && !Array.isArray(def);

function isFrameSelector(selector: string): boolean {
  return (
    selector === "from" || selector === "to" || PERCENTAGE_SELECTOR.test(selector)
  );
}

// `from`/`to` are aliases for `0%`/`100%`, so a `from` + `0%` pair is a
// duplicate keyframe and must be rejected like any other duplicate.
function normalizeSelector(selector: string): string {
  return (
    KEYFRAME_SELECTOR_ALIASES[
      selector as keyof typeof KEYFRAME_SELECTOR_ALIASES
    ] ?? selector
  );
}

function validateFrameProperty(
  keywords: SupportedKeywordsConfig,
  cssAttributesConfig: Record<string, any>,
  name: string,
  selector: string,
  prop: string,
  value: unknown,
): void {
  const attrDef = cssAttributesConfig[prop];
  if (typeof attrDef === "string") {
    try {
      parseValueAgainstDSL(keywords, attrDef, value as never);
      return;
    } catch (error) {
      throw new Error(
        `Invalid value '${String(value)}' for '${prop}' in keyframe '${name}' at '${selector}': ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  if (isGate(attrDef)) {
    if (typeof value === "string" && value in attrDef) return;
    for (const valueKey of Object.keys(attrDef)) {
      if (valueKey.startsWith("<") && valueKey.endsWith(">")) {
        try {
          parseValueAgainstDSL(keywords, valueKey, value as never);
          return;
        } catch {}
      }
    }
    throw new Error(
      `Invalid value '${String(value)}' for '${prop}' in keyframe '${name}' at '${selector}'. Expected one of: ${Object.keys(attrDef).join(", ")}`,
    );
  }
  throw new Error(
    `'${prop}' is not a recognized CSS property in keyframe '${name}' at '${selector}'`,
  );
}

// Registers named @keyframes. Frame property values validate against the CSS
// syntax config through the css attributes config's DSL strings — the same
// value-validating machinery css blocks use. The returned config's keys are
// the registered keyframe names (see `KeyframeName`); the integration slice
// constrains the `animation` property against that union.
export function cssKeyframesConfig<
  const S extends BaseCSSSyntaxConfig,
  const A extends BaseCSSAttributesComplexConfig,
  const C extends BaseKeyframesConfig,
>(
  syntaxConfig: S,
  cssAttributesConfig: A,
  config: ValidateKeyframesConfig<SupportedKeywords, S, A, C>,
): C {
  const keywords = Object.assign({}, SUPPORTED_KEYWORDS, syntaxConfig);

  for (const [name, frames] of Object.entries(config)) {
    if (!KEYFRAME_NAME.test(name)) {
      throw new Error(
        `Invalid keyframe name '${name}': must be a legal CSS identifier with no spaces`,
      );
    }
    if (frames === null || typeof frames !== "object" || Array.isArray(frames)) {
      throw new Error(`Keyframe animation '${name}' must be a frames object`);
    }

    const seen = new Set<string>();
    for (const [selector, properties] of Object.entries(
      frames as Record<string, unknown>,
    )) {
      const normalized = normalizeSelector(selector);
      if (seen.has(normalized)) {
        throw new Error(
          `Duplicate keyframe selector '${selector}' in animation '${name}': 'from'/'0%' and 'to'/'100%' are the same keyframe`,
        );
      }
      seen.add(normalized);

      if (!isFrameSelector(selector)) {
        throw new Error(
          `Invalid keyframe selector '${selector}' in animation '${name}': must be 'from', 'to', or a percentage like '50%'`,
        );
      }
      if (
        properties === null ||
        typeof properties !== "object" ||
        Array.isArray(properties)
      ) {
        throw new Error(
          `Keyframe selector '${selector}' in animation '${name}' must be a properties object`,
        );
      }

      for (const [prop, value] of Object.entries(
        properties as Record<string, unknown>,
      )) {
        validateFrameProperty(
          keywords,
          cssAttributesConfig,
          name,
          selector,
          prop,
          value,
        );
      }
    }
  }

  return config as C;
}