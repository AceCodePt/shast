// Runnable example: assemble the shipped `common` registry with the public
// surface, build a component, and print the rendered html/css.
//
// This is the wiring `shast add` generates into a consumer's tree, spelled out
// against the repository's own `src`: the engine, the `common` tier files, and
// the `cssPropertiesConfig` builder, imported directly.
//
// Run it with `pnpm example`.
import engine from "../src/engine/index.ts";
import { cssPropertiesConfig } from "../src/css/properties-config/index.ts";
import { SUPPORTED_KEYWORDS } from "tsyntax";
import commonHTMLTags from "../src/html/tag-config/tiers/common.ts";
import commonHTMLAttributes from "../src/html/attribute-config/tiers/common.ts";
import commonCSSSyntax from "../src/css/syntax-config/tiers/common.ts";
import commonCSSAttributes from "../src/css/attribute-config/tiers/common.ts";
import commonCSSPseudoClasses from "../src/css/pseudo-class-config/tiers/common.ts";
import commonCSSQueries from "../src/css/queries-config/tiers/common.ts";
import commonCSSKeyframes from "../src/css/keyframes-config/tiers/common.ts";

// CSS custom properties are per-consumer: they have no shipped tiers, so
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
        image: { tag: "img", attributes: { alt: "", src: "./check.png" } },
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
