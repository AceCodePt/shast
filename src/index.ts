// shast's public entry point.
//
// Importing this module has no side effects: it only re-exports the surface a
// consumer needs to assemble their own registry with `engine()`. A complete,
// runnable wiring lives in `examples/basic.ts` (`pnpm example`).

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export { default as engine } from "@/engine/index.ts";
export { renderComponent } from "@/engine/render/render-component.ts";

// ---------------------------------------------------------------------------
// Registry builders
// ---------------------------------------------------------------------------

export { htmlAttributeConfig } from "@/html/attribute-config/index.ts";
export { htmlTagConfig } from "@/html/tag-config/index.ts";
export { cssAttributeConfig } from "@/css/attribute-config/index.ts";
export { cssSyntaxConfig } from "@/css/syntax-config/index.ts";
export { cssPropertiesConfig } from "@/css/properties-config/index.ts";
export { cssPseudoClassConfig } from "@/css/pseudo-class-config/index.ts";
export { cssQueriesConfig } from "@/css/queries-config/index.ts";
export { cssKeyframesConfig } from "@/css/keyframes-config/index.ts";

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

export { SUPPORTED_KEYWORDS } from "tsyntax";
export type { SupportedKeywordsConfig } from "tsyntax";

// ---------------------------------------------------------------------------
// Shipped config variations
//
// `common` is the starting point; `minimal` and `full` are the two extremes.
// Copy the one you want next to your own code and edit it - the registry is
// meant to be owned, not imported as a fixed black box.
// ---------------------------------------------------------------------------

export { default as minimalHTMLTags } from "@/html/tag-config/variations/minimal.ts";
export { default as commonHTMLTags } from "@/html/tag-config/variations/common.ts";
export { default as fullHTMLTags } from "@/html/tag-config/variations/full.ts";

export { default as minimalHTMLAttributes } from "@/html/attribute-config/variations/minimal.ts";
export { default as commonHTMLAttributes } from "@/html/attribute-config/variations/common.ts";
export { default as fullHTMLAttributes } from "@/html/attribute-config/variations/full.ts";

export { default as minimalCSSSyntax } from "@/css/syntax-config/variations/minimal.ts";
export { default as commonCSSSyntax } from "@/css/syntax-config/variations/common.ts";
export { default as fullCSSSyntax } from "@/css/syntax-config/variations/full.ts";

export { default as minimalCSSAttributes } from "@/css/attribute-config/variations/minimal.ts";
export { default as commonCSSAttributes } from "@/css/attribute-config/variations/common.ts";
export { default as fullCSSAttributes } from "@/css/attribute-config/variations/full.ts";

export { default as minimalCSSPseudoClasses } from "@/css/pseudo-class-config/variations/minimal.ts";
export { default as commonCSSPseudoClasses } from "@/css/pseudo-class-config/variations/common.ts";
export { default as fullCSSPseudoClasses } from "@/css/pseudo-class-config/variations/full.ts";

export { default as minimalCSSQueries } from "@/css/queries-config/variations/minimal.ts";
export { default as commonCSSQueries } from "@/css/queries-config/variations/common.ts";
export { default as fullCSSQueries } from "@/css/queries-config/variations/full.ts";

export { default as minimalCSSKeyframes } from "@/css/keyframes-config/variations/minimal.ts";
export { default as commonCSSKeyframes } from "@/css/keyframes-config/variations/common.ts";
export { default as fullCSSKeyframes } from "@/css/keyframes-config/variations/full.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type {
  BaseComponentInnerHTMLStructure,
  BaseComponentStructure,
  ComponentIds,
  ValidateComponentStructure,
} from "@/engine/types.ts";

export type {
  BaseHTMLAttributeComplexValue,
  BaseHTMLAttributesConfig,
  BaseHTMLAttributeSimpleConfig,
  HTMLAttributeArms,
  InferHTMLAttributesConfig,
  InferHTMLAttributeValue,
  ValidateHTMLAttributesConfig,
  ValidateHTMLAttributeValue,
} from "@/html/attribute-config/types.ts";

export type {
  BaseHTMLTagConfig,
  ValidateHTMLTagConfig,
} from "@/html/tag-config/types.ts";

export type {
  BaseCSSAttributeComplexValue,
  BaseCSSAttributesComplexConfig,
  BaseCSSAttributeSimpleConfig,
  CSSAttributeArms,
  InferCSSAttributesConfig,
  InferCSSAttributesSimpleConfig,
  InferCSSAttributeValue,
  ValidateCSSAttributesConfig,
  ValidateCSSAttributeValue,
} from "@/css/attribute-config/types.ts";

export type {
  BaseCSSSyntaxConfig,
  CSSSyntaxKeywords,
  CSSSyntaxKeywordsConfig,
  InferCSSSyntaxConfig,
  ValidateCSSSyntaxConfig,
} from "@/css/syntax-config/types.ts";

export type {
  BaseCSSPropertiesConfig,
  CSSPropertiesConfigOptions,
  ValidateCSSPropertiesConfig,
} from "@/css/properties-config/types.ts";

export type { BaseCSSPseudoClassConfig } from "@/css/pseudo-class-config/types.ts";

export type {
  BaseKeyframesConfig,
  ValidateKeyframesConfig,
} from "@/css/keyframes-config/types.ts";
