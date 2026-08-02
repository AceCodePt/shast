import { cssPropertiesConfig } from "@/css/properties-config/index.ts";
import HTML_GLOBAL_ATTRIBUTES_CONFIG from "@/html/attribute-config/variations/common.ts";
import HTML_TAGS_CONFIG from "@/html/tag-config/variations/common.ts";
import CSS_SYNTAX_CONFIG from "@/css/syntax-config/variations/common.ts";
import CSS_ATTRIBUTES_CONFIG from "@/css/attribute-config/variations/common.ts";
import CSS_GLOBAL_PSEUDO_CLASSES_CONFIG from "@/css/pseudo-class-config/variations/common.ts";
import { SUPPORTED_KEYWORDS } from "@/dsl/index.ts";
import engine from "@/engine/index.ts";

export const CSS_GLOBAL_PROPERTIES = cssPropertiesConfig(
  SUPPORTED_KEYWORDS,
  CSS_SYNTAX_CONFIG,
  {
    "--a": {
      syntax: "<alpha-value>",
      inherits: true,
      "initial-value": "1%",
    },
    "--_a": {
      syntax: "<percentage>",
      inherits: false,
      "initial-value": "1%",
    },
    "--background-color": {
      syntax: "<color>",
      inherits: false,
      "initial-value": "hsl(1 1% 1%)",
    },
  },
);

const { createComponent, renderComponent } = engine({
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig: HTML_GLOBAL_ATTRIBUTES_CONFIG,
  htmlTagConfig: HTML_TAGS_CONFIG,
  cssSyntaxConfig: CSS_SYNTAX_CONFIG,
  cssAttributesConfig: CSS_ATTRIBUTES_CONFIG,
  cssPseudoClassConfig: CSS_GLOBAL_PSEUDO_CLASSES_CONFIG,
  cssPropertiesConfig: CSS_GLOBAL_PROPERTIES,
});

const card = createComponent({
  tag: "div",
  attributes: { dir: "auto" },
  innerHTML: {
    someImage: {
      tag: "a",
      attributes: {
        href: "",
      },
      css: {},
    },
    content: {
      tag: "div",
      innerHTML: {
        title: {
          tag: "h1",
          innerHTML: "someTitle",
        },
        subtitle: {
          tag: "h3",
          innerHTML: "subtitle",
        },
      },
    },
    asdf: {
      tag: "div",
    },
  },
  css: {
    width: "100px",
    "> content": {
      display: "flex",
      gap: "5px",
      "> title": {},
    },
  },
});

console.log(renderComponent(card));

createComponent({
  tag: "a",
  attributes: { dir: "ltr", href: "" },
  innerHTML: {
    image: {
      tag: "img",
      attributes: { alt: "", src: "" },
    },
    content: {
      tag: "div",
      innerHTML: {
        title: {
          tag: "h1",
          innerHTML: "My awesome product",
        },
        subtitle: {
          tag: "h1",
          innerHTML: "Small description about production",
        },
      },
    },
  },
  css: {
    display: "flex",
    width: "100px",
    "align-content": "flex-start",
    "--_a": "100%",
    ":hover": {
      display: "flex",
      "align-items": "end",
    },
    "::before": {},
    ":visited": {},
    "> content": {
      "> title": {
        color: "hsl(1 1% 1%)",
      },
      "> subtitle": {},
    },
  },
});

// console.log(
//   renderComponent(
//     HTML_TAG_DEFINITIONS,
//     CARD_COMPONENT("", "title", "description"),
//   ),
// );
