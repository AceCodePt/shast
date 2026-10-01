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
import CSS_QUERIES_CONFIG from "@/css/queries-config/variations/common.ts";

// ---------------------------------------------------------------------------
// Gate propagation through same-element blocks.
//
// A gate is element-scoped: `display: flex` unlocks `gap` on the element itself
// (self slot) and `flex` on its direct children (children slot). The gate must
// follow the element into every block that targets the SAME element (`:hover`,
// `@media`, `@container`, `&.class`), and reset at a different box (`> child`,
// `::before`). This suite exercises both walls with the same rows; negative type
// rows carry `@ts-expect-error`, so `pnpm check` fails if the type wall stops
// rejecting them and the file is its own tsc probe.
// ---------------------------------------------------------------------------

const CSS_GLOBAL_PROPERTIES = cssPropertiesConfig(
  SUPPORTED_KEYWORDS,
  CSS_SYNTAX_CONFIG,
  {},
);

const { createComponent } = engine({
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig: HTML_GLOBAL_ATTRIBUTES_CONFIG,
  htmlTagConfig: HTML_TAGS_CONFIG,
  cssSyntaxConfig: CSS_SYNTAX_CONFIG,
  cssAttributesConfig: CSS_ATTRIBUTES_CONFIG,
  cssPseudoClassConfig: CSS_GLOBAL_PSEUDO_CLASSES_CONFIG,
  cssPropertiesConfig: CSS_GLOBAL_PROPERTIES,
  cssQueriesConfig: CSS_QUERIES_CONFIG,
});

const GATED_SELF = {
  gap: "1rem",
  "justify-content": "center",
} as const;

describe("gate propagation through same-element blocks", () => {
  describe(":hover, @media and @container inherit the element's gates", () => {
    test("gap / justify-content inside :hover with display:flex at the top", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            display: "flex",
            ":hover": { ...GATED_SELF },
          },
        }),
      );
    });

    test("gap / justify-content inside @media with display:flex at the top", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            display: "flex",
            "@media (width < 768px)": { ...GATED_SELF },
          },
        }),
      );
    });

    test("gap / justify-content inside @container with display:flex at the top", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            display: "flex",
            "@container (width > 400px)": { ...GATED_SELF },
          },
        }),
      );
    });

    test("gap / justify-content inside &.active with display:flex at the top", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          attributes: { class: "active" },
          innerHTML: "x",
          css: {
            display: "flex",
            "&.active": { ...GATED_SELF },
          },
        }),
      );
    });

    test("the gate follows the element through nested same-element blocks", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            display: "flex",
            "@media (width < 768px)": {
              ":hover": { ...GATED_SELF },
            },
          },
        }),
      );
    });

    test("a gate written in a nested block wins over the inherited one", () => {
      // The nested display: block replaces the inherited display: flex, so gap
      // is locked again (the merge takes the written value, it is not an
      // intersection that would cancel the two displays).
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "x",
            css: {
              display: "flex",
              ":hover": {
                display: "block",
                // @ts-expect-error the :hover block's display: block wins
                gap: "1rem",
              },
            },
          }),
        /'gap' requires display: flex/,
      );
    });
  });

  describe("without a gate the props are still rejected (the gate propagates, it does not disappear)", () => {
    test("gap is rejected inside :hover with no display:flex anywhere", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "x",
            css: {
              ":hover": {
                // @ts-expect-error gap needs display:flex on the element
                gap: "1rem",
              },
            },
          }),
        /'gap' requires display: flex/,
      );
    });

    test("justify-content is rejected inside @media with no display:flex anywhere", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "x",
            css: {
              "@media (width < 768px)": {
                // @ts-expect-error justify-content needs display:flex on the element
                "justify-content": "center",
              },
            },
          }),
        /'justify-content' requires display: flex/,
      );
    });

    test("gap is rejected inside @container with no display:flex anywhere", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "x",
            css: {
              "@container (width > 400px)": {
                // @ts-expect-error gap needs display:flex on the element
                gap: "1rem",
              },
            },
          }),
        /'gap' requires display: flex/,
      );
    });
  });

  describe("children-slot props follow the element too", () => {
    test("flex is accepted inside :hover > c with the gate only at component level", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: { c: { tag: "span", innerHTML: "x" } },
          css: {
            display: "flex",
            ":hover": {
              "> c": { flex: "1" },
            },
          },
        }),
      );
    });

    test("flex is rejected inside :hover > c with no display:flex anywhere", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: { c: { tag: "span", innerHTML: "x" } },
            css: {
              ":hover": {
                "> c": {
                  // @ts-expect-error flex needs display:flex on the parent
                  flex: "1",
                },
              },
            },
          }),
        /'flex' requires display: flex/,
      );
    });
  });

  describe("a query inside a > child block keeps that child's element state", () => {
    test("a @media inside > c resolves its own > d against c's areas", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: {
            c: { tag: "div", innerHTML: { d: { tag: "span", innerHTML: "x" } } },
          },
          css: {
            "> c": {
              display: "grid",
              "grid-template-areas": "a a",
              "@media (width < 768px)": {
                "> d": { "grid-area": "a" },
              },
            },
          },
        }),
      );
    });

    test("a @media inside > c resolves against c, not the top element", () => {
      // The top element declares areas a | b; c declares only y. d inside c's
      // @media must see c's areas, so "a" is rejected even though the top
      // element defines it.
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: {
              c: { tag: "div", innerHTML: { d: { tag: "span", innerHTML: "x" } } },
            },
            css: {
              display: "grid",
              "grid-template-areas": "a a\nb b",
              "> c": {
                display: "grid",
                "grid-template-areas": "y y",
                "@media (width < 768px)": {
                  "> d": {
                    // @ts-expect-error 'a' is not one of c's areas (y)
                    "grid-area": "a",
                  },
                },
              },
            },
          }),
        /grid-area 'a' does not match any area defined by the parent's grid-template-areas \(y\)/,
      );
    });
  });

  describe("the element's gates do not cross into a > child's self slot", () => {
    test("gap inside > c is rejected when the child is not flex", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: { c: { tag: "span", innerHTML: "x" } },
            css: {
              display: "flex",
              "> c": {
                // @ts-expect-error the child span is inline; the parent's display does not reach its self slot
                gap: "1rem",
              },
            },
          }),
        /'gap' requires display: flex/,
      );
    });

    test("gap inside a @media > c is still rejected (the child is a different box)", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: { c: { tag: "span", innerHTML: "x" } },
            css: {
              display: "flex",
              "@media (width < 768px)": {
                "> c": {
                  // @ts-expect-error the child's self slot does not inherit the element's display
                  gap: "1rem",
                },
              },
            },
          }),
        /'gap' requires display: flex/,
      );
    });

    test("the implicit display never unlocks children, even through a query", () => {
      // div's implicit display: block is a self-slot default; the children slot
      // reads only explicitly written gates, here none.
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: { c: { tag: "span", innerHTML: "x" } },
            css: {
              "@media (width < 768px)": {
                "> c": {
                  // @ts-expect-error div's implicit block display never unlocks children
                  flex: "1",
                },
              },
            },
          }),
        /'flex' requires display: flex/,
      );
    });

    test("gap inside > c is accepted when the child declares display:flex itself", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: { c: { tag: "span", innerHTML: "x" } },
          css: {
            display: "flex",
            "> c": { display: "flex", gap: "1rem" },
          },
        }),
      );
    });
  });

  describe("a > child inside :hover resolves grid-area against the element's areas", () => {
    test("a matching area name is accepted at both walls", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: { c: { tag: "span", innerHTML: "x" } },
          css: {
            display: "grid",
            "grid-template-areas": "a a\nb b",
            ":hover": {
              "> c": { "grid-area": "a" },
            },
          },
        }),
      );
    });

    test("a non-matching area name is rejected at both walls", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: { c: { tag: "span", innerHTML: "x" } },
            css: {
              display: "grid",
              "grid-template-areas": "a a\nb b",
              ":hover": {
                "> c": {
                  // @ts-expect-error 'c' is not one of the element's areas (a | b)
                  "grid-area": "c",
                },
              },
            },
          }),
        /grid-area 'c' does not match any area defined by the parent's grid-template-areas \(a, b\)/,
      );
    });
  });

  describe("pseudo-elements: children half applies, self half does not", () => {
    test("flex inside ::before is accepted when the element is display:flex", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            display: "flex",
            "::before": { flex: "1" },
          },
        }),
      );
    });

    test("gap inside ::before is rejected even when the element is display:flex", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "x",
            css: {
              display: "flex",
              "::before": {
                // @ts-expect-error a pseudo-element's self slot needs its own display:flex
                gap: "1rem",
              },
            },
          }),
        /'gap' requires display: flex/,
      );
    });

    test("gap inside ::before is accepted when ::before declares display:flex itself", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            "::before": { display: "flex", gap: "1rem" },
          },
        }),
      );
    });

    test("grid-area inside ::before resolves against the element's areas", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            display: "grid",
            "grid-template-areas": "a a",
            "::before": { "grid-area": "a" },
          },
        }),
      );
    });

    test("a non-matching grid-area inside ::before is rejected", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "x",
            css: {
              display: "grid",
              "grid-template-areas": "a a",
              "::before": {
                // @ts-expect-error 'b' is not one of the element's areas (a)
                "grid-area": "b",
              },
            },
          }),
        /grid-area 'b' does not match any area defined by the parent's grid-template-areas \(a\)/,
      );
    });
  });
});
