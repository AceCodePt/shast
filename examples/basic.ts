// Runnable example: assemble the shipped `common` registry with the public
// surface, build a component, and print the rendered html/css.
//
// This is the piece that used to live in `src/index.ts` as a side effect.
// Run it with `pnpm example`.
import {
  commonCSSAttributes,
  commonCSSKeyframes,
  commonCSSPseudoClasses,
  commonCSSQueries,
  commonCSSSyntax,
  commonHTMLAttributes,
  commonHTMLTags,
  cssPropertiesConfig,
  engine,
  SUPPORTED_KEYWORDS,
} from "../src/index.ts";

// CSS custom properties are per-consumer: they have no shipped variations, so
// the example registers the handful the demo component uses.
const cssProperties = cssPropertiesConfig(SUPPORTED_KEYWORDS, commonCSSSyntax, {
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
});

const { createComponent, renderComponent } = engine({
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig: commonHTMLAttributes,
  htmlTagConfig: commonHTMLTags,
  cssSyntaxConfig: commonCSSSyntax,
  cssAttributesConfig: commonCSSAttributes,
  cssPseudoClassConfig: commonCSSPseudoClasses,
  cssPropertiesConfig: cssProperties,
  cssQueriesConfig: commonCSSQueries,
  cssKeyframesConfig: commonCSSKeyframes,
});

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
    display: "flex",
    width: "100px",
    "align-content": "flex-start",
    "--_a": "100%",
    ":hover": {
      display: "flex",
      "align-items": "end",
    },
    "::before": {},
    "> item": {
      "> image": {},
      "> text": {
        color: "hsl(1 1% 1%)",
        "> demo": {},
      },
    },
  },
});

const { html, css } = renderComponent(list);
console.log(html.replaceAll(">", ">\n"), css);
