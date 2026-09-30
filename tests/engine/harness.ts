import engine from "@/engine/index.ts";
import { renderComponent } from "@/engine/render/render-component.ts";
import { cssPropertiesConfig } from "@/css/properties-config/index.ts";
import { cssSyntaxConfig } from "@/css/syntax-config/index.ts";
import { cssAttributeConfig } from "@/css/attribute-config/index.ts";
import { htmlAttributeConfig } from "@/html/attribute-config/index.ts";
import { htmlTagConfig } from "@/html/tag-config/index.ts";
import HTML_GLOBAL_ATTRIBUTES_CONFIG from "@/html/attribute-config/variations/common.ts";
import HTML_TAGS_CONFIG from "@/html/tag-config/variations/common.ts";
import CSS_SYNTAX_CONFIG from "@/css/syntax-config/variations/common.ts";
import CSS_ATTRIBUTES_CONFIG from "@/css/attribute-config/variations/common.ts";
import CSS_GLOBAL_PSEUDO_CLASSES_CONFIG from "@/css/pseudo-class-config/variations/common.ts";
import { SUPPORTED_KEYWORDS } from "tsyntax";

// Shared setup for the fragments split out of the former engine.test.ts. This
// module declares no tests and is not matched by the runner's `*.test.ts` glob,
// so it is type-checked once and reused by every fragment.
export {
  engine,
  renderComponent,
  cssPropertiesConfig,
  cssSyntaxConfig,
  cssAttributeConfig,
  htmlAttributeConfig,
  htmlTagConfig,
  HTML_GLOBAL_ATTRIBUTES_CONFIG,
  HTML_TAGS_CONFIG,
  CSS_SYNTAX_CONFIG,
  CSS_ATTRIBUTES_CONFIG,
  CSS_GLOBAL_PSEUDO_CLASSES_CONFIG,
  SUPPORTED_KEYWORDS,
};

export const EMPTY_QUERIES = [] as const;

export const CSS_GLOBAL_PROPERTIES = cssPropertiesConfig(
  SUPPORTED_KEYWORDS,
  CSS_SYNTAX_CONFIG,
  {
    "--_a": {
      syntax: "<percentage>",
      inherits: false,
      "initial-value": "1%",
    },
  },
);

export const {
  createComponent,
  renderComponent: renderBound,
  cssProperties,
} = engine({
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig: HTML_GLOBAL_ATTRIBUTES_CONFIG,
  htmlTagConfig: HTML_TAGS_CONFIG,
  cssSyntaxConfig: CSS_SYNTAX_CONFIG,
  cssAttributesConfig: CSS_ATTRIBUTES_CONFIG,
  cssPseudoClassConfig: CSS_GLOBAL_PSEUDO_CLASSES_CONFIG,
  cssPropertiesConfig: CSS_GLOBAL_PROPERTIES,
  cssQueriesConfig: EMPTY_QUERIES,
});

export const EMPTY_PSEUDO_CLASSES = [] as const;

export const MOCK_CSS_ATTR_CONFIG = cssAttributeConfig(SUPPORTED_KEYWORDS, cssSyntaxConfig(SUPPORTED_KEYWORDS, {}), {
  display: {
    block: { self: {}, children: {} },
    inline: { self: {}, children: {} },
    "inline-block": { self: {}, children: {} },
    flex: { self: {}, children: {} },
    grid: { self: {}, children: {} },
    none: { self: {}, children: {} },
    "list-item": { self: {}, children: {} },
    contents: { self: {}, children: {} },
    table: { self: {}, children: {} },
    "table-cell": { self: {}, children: {} },
  },
} as const);

export const MOCK_SHARED_ATTRIBUTES = htmlAttributeConfig(SUPPORTED_KEYWORDS, {
  id: "string | undefined",
  class: "string | undefined",
});

export const MOCK_TAG_CONFIG = htmlTagConfig(SUPPORTED_KEYWORDS, MOCK_CSS_ATTR_CONFIG, {
  div: {
    display: "block",
    attributes: {},
    innerHTML: { all: true },
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  p: {
    display: "block",
    attributes: {},
    innerHTML: { include: ["#text"] },
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  img: {
    display: "inline",
    attributes: { src: "string", alt: "string" },
    innerHTML: { include: [] },
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  ul: {
    display: "block",
    attributes: {},
    innerHTML: { include: ["li"] },
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  li: {
    display: "block",
    attributes: {},
    innerHTML: { include: ["#text", "div"] },
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
});

export const MOCK_INHERIT_CONFIG = htmlTagConfig(SUPPORTED_KEYWORDS, MOCK_CSS_ATTR_CONFIG, {
  a: {
    display: "inline",
    attributes: {},
    innerHTML: { include: ["#text", "h1", "span", "ul", "div"] },
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  h1: {
    display: "block",
    attributes: {},
    innerHTML: { include: ["#text", "span", "b"] },
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  span: {
    display: "inline",
    attributes: {},
    innerHTML: { include: ["#text", "b"] },
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  b: {
    display: "inline",
    attributes: {},
    innerHTML: { include: ["#text"] },
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  ul: {
    display: "block",
    attributes: {},
    innerHTML: { include: ["li"] },
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  li: {
    display: "block",
    attributes: {},
    innerHTML: { include: ["#text", "div", "span", "b"] },
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  div: {
    display: "block",
    attributes: {},
    innerHTML: { all: true },
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
});

export const MOCK_CSS_SYNTAX = cssSyntaxConfig(SUPPORTED_KEYWORDS, {});
export const MOCK_CSS_PROPERTIES = cssPropertiesConfig(
  SUPPORTED_KEYWORDS,
  MOCK_CSS_SYNTAX,
  {},
);

export const { createComponent: createMockComponent } = engine({
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig: MOCK_SHARED_ATTRIBUTES,
  htmlTagConfig: MOCK_TAG_CONFIG,
  cssSyntaxConfig: MOCK_CSS_SYNTAX,
  cssAttributesConfig: MOCK_CSS_ATTR_CONFIG,
  cssPseudoClassConfig: EMPTY_PSEUDO_CLASSES,
  cssPropertiesConfig: MOCK_CSS_PROPERTIES,
  cssQueriesConfig: EMPTY_QUERIES,
});

export const { createComponent: createInheritComponent } = engine({
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig: MOCK_SHARED_ATTRIBUTES,
  htmlTagConfig: MOCK_INHERIT_CONFIG,
  cssSyntaxConfig: MOCK_CSS_SYNTAX,
  cssAttributesConfig: MOCK_CSS_ATTR_CONFIG,
  cssPseudoClassConfig: EMPTY_PSEUDO_CLASSES,
  cssPropertiesConfig: MOCK_CSS_PROPERTIES,
  cssQueriesConfig: EMPTY_QUERIES,
});
