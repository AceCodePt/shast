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
      "initial-value": "1",
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

//@ts-ignore
const card = (num: number) => {
  const active = num > 1 ? "active" : "";
  return createComponent({
    tag: "li",
    attributes: { dir: "auto", class: `${active}` },
    innerHTML: {
      link: {
        tag: "input",
        attributes: { type: "number" },
      },
    },
    css: {
      "--_a": "10%",
      width: "10px",
      "::after": { display: "flex" },
    },
  });
};

const list = createComponent({
  tag: "ul",
  innerHTML: {
    item: {
      tag: "li",
      innerHTML: {
        image: { tag: "img", attributes: { alt: "", src: "" } },
        text: {
          tag: "button",
          innerHTML: {
            demo: {
              tag: "span",
              innerHTML: "",
            },
          },
        },
      },
    },
  },
  css: {
    "--_a": "1%",
    display: "block",
    width: "100%",
    perspective: "10px",
    "perspective-origin": "top",
  },
});

const renderd = renderComponent(list);
console.log(renderd.html.replaceAll(">", ">\n"), renderd.css);

export default createComponent;
