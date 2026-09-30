import test, { describe } from "node:test";
import assert from "node:assert";
import engine from "@/engine/index.ts";
import { cssPropertiesConfig } from "@/css/properties-config/index.ts";
import { SUPPORTED_KEYWORDS } from "tsyntax";
import HTML_GLOBAL_ATTRIBUTES_CONFIG from "@/html/attribute-config/variations/common.ts";
import HTML_TAGS_CONFIG from "@/html/tag-config/variations/common.ts";
import CSS_SYNTAX_CONFIG from "@/css/syntax-config/variations/common.ts";
import CSS_ATTRIBUTES_CONFIG from "@/css/attribute-config/variations/common.ts";
import CSS_GLOBAL_PSEUDO_CLASSES_CONFIG from "@/css/pseudo-class-config/variations/common.ts";

// `grid-area` places a grid item into a named area the parent's
// `grid-template-areas` defines. Neither DSL is extended (`grid-template-areas`
// stays a plain `<string>`, `grid-area` stays `<custom-ident>`), so the
// cross-reference is a structural check: the parent's literal string is split
// into its area-name union and the child's `grid-area` must be a member. This
// suite exercises both walls with the same rows, mirroring the innerHTML
// inheritance conformance pattern.
//
// Negative type rows use `@ts-expect-error`: `pnpm check` fails if the type wall
// stops rejecting them (an unused directive is itself a compile error), so the
// file is the tsc probe as well as the runtime suite.

const CSS_GLOBAL_PROPERTIES = cssPropertiesConfig(
  SUPPORTED_KEYWORDS,
  CSS_SYNTAX_CONFIG,
  {},
);

const engineConfig = {
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig: HTML_GLOBAL_ATTRIBUTES_CONFIG,
  htmlTagConfig: HTML_TAGS_CONFIG,
  cssSyntaxConfig: CSS_SYNTAX_CONFIG,
  cssAttributesConfig: CSS_ATTRIBUTES_CONFIG,
  cssPseudoClassConfig: CSS_GLOBAL_PSEUDO_CLASSES_CONFIG,
  cssPropertiesConfig: CSS_GLOBAL_PROPERTIES,
  cssQueriesConfig: [] as const,
};

const { createComponent } = engine(engineConfig);

describe("grid-area against the parent's grid-template-areas", () => {
  describe("Runtime validation", () => {
    test("accepts a name defined by a multi-line grid-template-areas", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: { c: { tag: "span", innerHTML: "x" } },
          css: {
            display: "grid",
            "grid-template-areas": "a a\nb b",
            "> c": { "grid-area": "a" },
          },
        }),
      );
    });

    test("accepts a name defined by a quoted multi-line grid-template-areas", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: { c: { tag: "span", innerHTML: "x" } },
          css: {
            display: "grid",
            "grid-template-areas": '"a a" "b b"',
            "> c": { "grid-area": "b" },
          },
        }),
      );
    });

    test("accepts a name from an area row containing . empty cells", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: { c: { tag: "span", innerHTML: "x" } },
          css: {
            display: "grid",
            "grid-template-areas": "a . c\n. . c",
            "> c": { "grid-area": "c" },
          },
        }),
      );
    });

    test("rejects a name the parent's grid-template-areas does not define", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: { c: { tag: "span", innerHTML: "x" } },
            css: {
              display: "grid",
              "grid-template-areas": "a a\nb b",
              "> c": {
                // @ts-expect-error 'c' is not one of the parent's areas (a | b)
                "grid-area": "c",
              },
            },
          }),
        /CSS Error: grid-area 'c' does not match any area defined by the parent's grid-template-areas \(a, b\)/,
      );
    });

    test(". empty cells are not names", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: { c: { tag: "span", innerHTML: "x" } },
            css: {
              display: "grid",
              "grid-template-areas": "a . b",
              "> c": {
                // @ts-expect-error '.' marks an empty cell, not an area name
                "grid-area": ".",
              },
            },
          }),
        /CSS Error: grid-area '\.' does not match any area defined by the parent's grid-template-areas/,
      );
    });

    test("a parent without grid-template-areas constrains nothing", () => {
      // No literal to read means no membership fact; the runtime must not
      // reject what it cannot see (mirrors GridAreaConstraint returning {}).
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: { c: { tag: "span", innerHTML: "x" } },
          css: {
            display: "grid",
            "> c": { "grid-area": "whatever" },
          },
        }),
      );
    });
  });
});
