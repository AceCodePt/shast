import type {
  BaseCSSAttributesComplexConfig,
  ValidateCSSAttributesConfig,
} from "@/css/attribute-config/types.ts";
import type {
  BaseCSSPropertiesConfig,
  ValidateCSSPropertiesConfig,
} from "@/css/properties-config/types.ts";
import type { BaseCSSPseudoClassConfig } from "@/css/pseudo-class-config/types.ts";
import type { CSSSyntaxKeywords } from "@/css/syntax-config/types.ts";
import type { BaseKeyframesConfig } from "@/css/keyframes-config/types.ts";
import type { SupportedKeywordsConfig } from "tsyntax";
import type {
  BaseHTMLAttributesConfig,
  ValidateHTMLAttributesConfig,
} from "@/html/attribute-config/types.ts";
import type {
  BaseHTMLTagConfig,
  ValidateHTMLTagConfig,
} from "@/html/tag-config/types.ts";
import { renderCSSPropertiesConfig } from "@/engine/render/properties-config.ts";
import { renderComponent } from "@/engine/render/render-component.ts";
import type {
  BaseComponentStructure,
  ValidateComponentStructure,
} from "@/engine/types.ts";
import { validateHtmlNode } from "@/engine/validate/html.ts";
import type { AllowedTagSet, ValidationContext } from "@/engine/validate/context.ts";

// The runtime wall's entry point: validate a component node and its subtree
// against a built `ValidationContext`. The HTML and CSS layers live in
// `engine/validate/`, and each layer imports the gate machinery, so the two
// walls stay in sync.
export function validateComponentNode(
  context: ValidationContext,
  node: unknown,
  inheritedAllowed: AllowedTagSet,
): void {
  validateHtmlNode(context, node, inheritedAllowed, "root");
}

export default function engine<
  const SupportedKeywords extends SupportedKeywordsConfig,
  const HTMLGlobalAttributesConfig extends BaseHTMLAttributesConfig,
  const HTMLTagConfig extends BaseHTMLTagConfig,
  const CSSSyntaxConfig extends CSSSyntaxKeywords,
  const CSSAttributesConfig extends BaseCSSAttributesComplexConfig,
  const CSSPseudoClassConfig extends BaseCSSPseudoClassConfig,
  const CSSPropertiesConfig extends BaseCSSPropertiesConfig,
  const CSSQueriesConfig extends readonly string[],
  const CSSKeyframesConfig extends BaseKeyframesConfig = {},
>(
  config: {
    supportedKeywords: SupportedKeywords;
    htmlAttributesConfig: ValidateHTMLAttributesConfig<
      SupportedKeywords,
      HTMLGlobalAttributesConfig
    >;
    htmlTagConfig: ValidateHTMLTagConfig<
      SupportedKeywords,
      CSSAttributesConfig,
      HTMLTagConfig
    >;
    cssSyntaxConfig: CSSSyntaxConfig;
    cssAttributesConfig: ValidateCSSAttributesConfig<
      SupportedKeywords,
      CSSSyntaxConfig,
      CSSAttributesConfig
    >;
    cssPseudoClassConfig: CSSPseudoClassConfig;
    // The registry builder (`cssPropertiesConfig`) enforces the no-union
    // policy and is the only supported way to build one. The engine trusts that
    // already-validated registry, so it permits unions here rather than
    // re-deciding against the flag it cannot see.
    cssPropertiesConfig: ValidateCSSPropertiesConfig<
      SupportedKeywords,
      CSSSyntaxConfig,
      CSSPropertiesConfig,
      true
    >;
    cssQueriesConfig: CSSQueriesConfig;
    // Registered @keyframes. Optional so a registry that does not animate
    // gains nothing; when present, `animation-name` / `animation` are
    // constrained to the registered names at both walls.
    cssKeyframesConfig?: CSSKeyframesConfig;
  },
) {
  // The registry snapshot is fixed for the engine's lifetime, so build it once
  // and hand the same value to every recursive step.
  const validationContext: ValidationContext = {
    keywords: config.supportedKeywords,
    mergedKeywords: Object.assign(
      {},
      config.cssSyntaxConfig,
      config.supportedKeywords,
    ),
    globalAttributes: config.htmlAttributesConfig,
    tagConfig: config.htmlTagConfig,
    cssAttributesConfig: config.cssAttributesConfig,
    cssPropertiesConfig: config.cssPropertiesConfig,
    registeredQueries: new Set(config.cssQueriesConfig),
    registeredPseudoClasses: new Set(config.cssPseudoClassConfig),
    cssKeyframesConfig: config.cssKeyframesConfig ?? {},
  };

  const createComponent = <const T extends BaseComponentStructure>(
    componentStructure: ValidateComponentStructure<
      SupportedKeywords,
      HTMLGlobalAttributesConfig,
      HTMLTagConfig,
      CSSSyntaxConfig,
      CSSAttributesConfig,
      CSSPseudoClassConfig,
      CSSPropertiesConfig,
      CSSQueriesConfig,
      CSSKeyframesConfig,
      keyof HTMLTagConfig | "#text",
      T,
      keyof HTMLTagConfig | "#text"
    >,
  ) => {
    validateComponentNode(validationContext, componentStructure, null);
    return componentStructure as T;
  };

  const renderComponentBound = <const T extends BaseComponentStructure>(
    componentStructure: T,
  ) => {
    return renderComponent(
      config.htmlTagConfig,
      componentStructure,
      config.htmlAttributesConfig,
      Object.assign(
        {},
        config.cssSyntaxConfig,
        config.supportedKeywords,
      ),
      config.cssKeyframesConfig ?? {},
    );
  };

  return {
    createComponent: createComponent,
    renderComponent: renderComponentBound,
    cssProperties: renderCSSPropertiesConfig(config.cssPropertiesConfig),
  };
}
