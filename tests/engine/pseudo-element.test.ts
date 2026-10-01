import test, { describe } from "node:test";
import assert from "node:assert";
import {
  engine,
  cssAttributeConfig,
  cssPropertiesConfig,
  htmlTagConfig,
  SUPPORTED_KEYWORDS,
  EMPTY_QUERIES,
  EMPTY_PSEUDO_CLASSES,
  MOCK_CSS_ATTR_CONFIG,
  MOCK_SHARED_ATTRIBUTES,
  MOCK_CSS_SYNTAX,
} from "./harness.ts";

describe("createComponent (engine)", () => {
  describe("Component CSS: Pseudo-Element Block Validation", () => {
    const PE_CSS_ATTRIBUTES = cssAttributeConfig(
      SUPPORTED_KEYWORDS,
      MOCK_CSS_SYNTAX,
      {
        color: ["string"],
        display: {
          block: { self: {}, children: {} },
          inline: { self: {}, children: {} },
          "inline-block": { self: {}, children: {} },
          none: { self: {}, children: {} },
        },
      } as const,
    );
    const PE_CSS_PROPERTIES = cssPropertiesConfig(
      SUPPORTED_KEYWORDS,
      MOCK_CSS_SYNTAX,
      {},
    );

    const PE_TAG_CONFIG = htmlTagConfig(SUPPORTED_KEYWORDS, MOCK_CSS_ATTR_CONFIG, {
      field: {
        display: "inline-block",
        attributes: {},
        innerHTML: { include: ["#text"] },
        cssPseudoClass: [":hover"],
        cssPseudoElement: ["::placeholder"],
      },
      box: {
        display: "block",
        attributes: {},
        innerHTML: { all: true },
        cssPseudoClass: [],
        cssPseudoElement: ["::before", "::after"],
      },
      span: {
        display: "inline",
        attributes: {},
        innerHTML: { include: ["#text"] },
        cssPseudoClass: [],
        cssPseudoElement: [],
      },
    });

    const { createComponent: createPEComponent } = engine({
      supportedKeywords: SUPPORTED_KEYWORDS,
      htmlAttributesConfig: MOCK_SHARED_ATTRIBUTES,
      htmlTagConfig: PE_TAG_CONFIG,
      cssSyntaxConfig: MOCK_CSS_SYNTAX,
      cssAttributesConfig: PE_CSS_ATTRIBUTES,
      cssPseudoClassConfig: EMPTY_PSEUDO_CLASSES,
      cssPropertiesConfig: PE_CSS_PROPERTIES,
      cssQueriesConfig: EMPTY_QUERIES,
    });

    test("accepts a declared pseudo-element block containing CSS properties", () => {
      const config = createPEComponent({
        tag: "field",
        innerHTML: "x",
        css: {
          color: "black",
          "::placeholder": { color: "gray", display: "block" },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "field",
        innerHTML: "x",
        css: {
          color: "black",
          "::placeholder": { color: "gray", display: "block" },
        },
      });
    });

    test("accepts multiple declared pseudo-elements in the same css block", () => {
      const config = createPEComponent({
        tag: "box",
        innerHTML: "x",
        css: {
          "::before": { color: "red" },
          "::after": { color: "blue" },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "box",
        innerHTML: "x",
        css: {
          "::before": { color: "red" },
          "::after": { color: "blue" },
        },
      });
    });

    test("accepts a pseudo-element inside a child selector, scoped to the child's tag", () => {
      const config = createPEComponent({
        tag: "box",
        innerHTML: { fld: { tag: "field", innerHTML: "x" } },
        css: {
          "> fld": { "::placeholder": { color: "gray" } },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "box",
        innerHTML: { fld: { tag: "field", innerHTML: "x" } },
        css: {
          "> fld": { "::placeholder": { color: "gray" } },
        },
      });
    });

    test("accepts a child selector inside a pseudo-element block", () => {
      const config = createPEComponent({
        tag: "box",
        innerHTML: { item: { tag: "span", innerHTML: "x" } },
        css: {
          "::before": { "> item": { color: "red" } },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "box",
        innerHTML: { item: { tag: "span", innerHTML: "x" } },
        css: {
          "::before": { "> item": { color: "red" } },
        },
      });
    });

    test("accepts a pseudo-element inside a class selector block", () => {
      const config = createPEComponent({
        tag: "field",
        attributes: { class: "active" },
        innerHTML: "x",
        css: {
          "&.active": { "::placeholder": { color: "gray" } },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "field",
        attributes: { class: "active" },
        innerHTML: "x",
        css: {
          "&.active": { "::placeholder": { color: "gray" } },
        },
      });
    });

    test("accepts a pseudo-element inside a pseudo-class block", () => {
      const config = createPEComponent({
        tag: "field",
        innerHTML: "x",
        css: {
          ":hover": { "::placeholder": { color: "gray" } },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "field",
        innerHTML: "x",
        css: {
          ":hover": { "::placeholder": { color: "gray" } },
        },
      });
    });

    test("accepts a pseudo-class inside a pseudo-element block", () => {
      const config = createPEComponent({
        tag: "field",
        innerHTML: "x",
        css: {
          "::placeholder": { ":hover": { color: "gray" } },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "field",
        innerHTML: "x",
        css: {
          "::placeholder": { ":hover": { color: "gray" } },
        },
      });
    });

    test("rejects a pseudo-element the tag does not declare", () => {
      assert.throws(
        () =>
          createPEComponent({
            tag: "field",
            innerHTML: "x",
            css: {
              // @ts-expect-error
              "::before": { color: "red" },
            },
          }),
        /CSS Error: Pseudo-element '::before' is not declared on tag 'field'/,
      );
    });

    test("rejects a pseudo-element on a tag with an empty cssPseudoElement list", () => {
      assert.throws(
        () =>
          createPEComponent({
            tag: "span",
            innerHTML: "x",
            css: {
              // @ts-expect-error
              "::placeholder": { color: "red" },
            },
          }),
        /CSS Error: Pseudo-element '::placeholder' is not declared on tag 'span'/,
      );
    });

    test("rejects a pseudo-element on a tag with no cssPseudoElement key", () => {
      const NO_PE_TAG_CONFIG = {
        plain: {
          attributes: {},
          innerHTML: { include: ["#text"] },
          cssPseudoClass: [],
        },
      };
      const { createComponent: createNoPEComponent } = engine({
        supportedKeywords: SUPPORTED_KEYWORDS,
        htmlAttributesConfig: MOCK_SHARED_ATTRIBUTES,
        // @ts-expect-error
        htmlTagConfig: NO_PE_TAG_CONFIG,
        cssSyntaxConfig: MOCK_CSS_SYNTAX,
        cssAttributesConfig: PE_CSS_ATTRIBUTES,
        cssPseudoClassConfig: EMPTY_PSEUDO_CLASSES,
        cssPropertiesConfig: PE_CSS_PROPERTIES,
        cssQueriesConfig: EMPTY_QUERIES,
      });
      assert.throws(
        () =>
          createNoPEComponent({
            tag: "plain",
            attributes: {},
            innerHTML: "x",
            css: {
              "::placeholder": { color: "red" },
            },
          }),
        /CSS Error: Pseudo-element '::placeholder' is not declared on tag 'plain'/,
      );
    });

    test("rejects a pseudo-element nested inside another pseudo-element", () => {
      createPEComponent({
        tag: "box",
        innerHTML: "x",
        css: {
          "::before": {
            // @ts-expect-error
            "::after": { color: "red" },
          },
        },
      });
    });

    test("rejects a class selector inside a pseudo-element", () => {
      assert.throws(
        () =>
          createPEComponent({
            tag: "field",
            attributes: { class: "active" },
            innerHTML: "x",
            css: {
              "::placeholder": {
                // @ts-expect-error
                "&.active": { color: "gray" },
              },
            },
          }),
        /CSS Error: Class selector '&.active' is not allowed inside a pseudo-element block/,
      );
    });
  });
});
