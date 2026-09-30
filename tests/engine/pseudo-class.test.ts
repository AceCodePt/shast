import test, { describe } from "node:test";
import assert from "node:assert";
import {
  engine,
  cssAttributeConfig,
  cssPropertiesConfig,
  htmlTagConfig,
  SUPPORTED_KEYWORDS,
  EMPTY_QUERIES,
  MOCK_CSS_ATTR_CONFIG,
  MOCK_SHARED_ATTRIBUTES,
  MOCK_CSS_SYNTAX,
} from "./harness.ts";

describe("createComponent (engine)", () => {
  describe("Component CSS: Pseudo-Class Block Validation", () => {
    const PSEUDO_CSS_ATTRIBUTES = cssAttributeConfig(
      SUPPORTED_KEYWORDS,
      MOCK_CSS_SYNTAX,
      {
        color: "string",
        display: {
          block: { self: {}, children: {} },
          inline: { self: {}, children: {} },
          "inline-block": { self: {}, children: {} },
          none: { self: {}, children: {} },
        },
      } as const,
    );
    const PSEUDO_CSS_PROPERTIES = cssPropertiesConfig(
      SUPPORTED_KEYWORDS,
      MOCK_CSS_SYNTAX,
      {},
    );
    const GLOBAL_PSEUDO = [":active"] as const;

    const PSEUDO_TAG_CONFIG = htmlTagConfig(SUPPORTED_KEYWORDS, MOCK_CSS_ATTR_CONFIG, {
      button: {
        display: "inline-block",
        attributes: {},
        innerHTML: { include: ["#text"] },
        cssPseudoClass: [":hover", ":focus"],
        cssPseudoElement: [],
      },
      span: {
        display: "inline",
        attributes: {},
        innerHTML: { include: ["#text"] },
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

    const { createComponent: createPseudoComponent } = engine({
      supportedKeywords: SUPPORTED_KEYWORDS,
      htmlAttributesConfig: MOCK_SHARED_ATTRIBUTES,
      htmlTagConfig: PSEUDO_TAG_CONFIG,
      cssSyntaxConfig: MOCK_CSS_SYNTAX,
      cssAttributesConfig: PSEUDO_CSS_ATTRIBUTES,
      cssPseudoClassConfig: GLOBAL_PSEUDO,
      cssPropertiesConfig: PSEUDO_CSS_PROPERTIES,
      cssQueriesConfig: EMPTY_QUERIES,
    });

    test("accepts a declared pseudo-class block containing CSS properties", () => {
      const config = createPseudoComponent({
        tag: "button",
        innerHTML: "Click",
        css: {
          color: "black",
          ":hover": { color: "red", display: "block" },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "button",
        innerHTML: "Click",
        css: {
          color: "black",
          ":hover": { color: "red", display: "block" },
        },
      });
    });

    test("accepts multiple declared pseudo-classes in the same css block", () => {
      const config = createPseudoComponent({
        tag: "button",
        innerHTML: "Click",
        css: {
          ":hover": { color: "red" },
          ":focus": { color: "blue" },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "button",
        innerHTML: "Click",
        css: {
          ":hover": { color: "red" },
          ":focus": { color: "blue" },
        },
      });
    });

    test("accepts a globally-configured pseudo-class on any tag", () => {
      const config = createPseudoComponent({
        tag: "span",
        innerHTML: "text",
        css: {
          ":active": { color: "red" },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "span",
        innerHTML: "text",
        css: {
          ":active": { color: "red" },
        },
      });
    });

    test("accepts a pseudo-class inside a child selector, scoped to the child's tag", () => {
      const config = createPseudoComponent({
        tag: "div",
        innerHTML: { label: { tag: "button", innerHTML: "Hi" } },
        css: {
          "> label": { ":hover": { color: "red" } },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "div",
        innerHTML: { label: { tag: "button", innerHTML: "Hi" } },
        css: {
          "> label": { ":hover": { color: "red" } },
        },
      });
    });

    test("accepts a child selector inside a pseudo-class block", () => {
      const config = createPseudoComponent({
        tag: "div",
        innerHTML: { label: { tag: "button", innerHTML: "Hi" } },
        css: {
          ":active": { "> label": { color: "red" } },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "div",
        innerHTML: { label: { tag: "button", innerHTML: "Hi" } },
        css: {
          ":active": { "> label": { color: "red" } },
        },
      });
    });

    test("accepts a pseudo-class nested inside another pseudo-class", () => {
      const config = createPseudoComponent({
        tag: "button",
        innerHTML: "Click",
        css: {
          ":hover": { ":focus": { color: "red" } },
        },
      });
      assert.deepStrictEqual(config, {
        tag: "button",
        innerHTML: "Click",
        css: {
          ":hover": { ":focus": { color: "red" } },
        },
      });
    });

    test("rejects a pseudo-class the tag does not declare and is not global", () => {
      assert.throws(
        () =>
          createPseudoComponent({
            tag: "button",
            innerHTML: "Click",
            css: {
              // @ts-expect-error
              ":disabled": { color: "red" },
            },
          }),
        /CSS Error: Pseudo-class ':disabled' is not registered in the cssPseudoClassConfig/,
      );
    });

    test("rejects a pseudo-class on a tag with an empty cssPseudoClass list", () => {
      assert.throws(
        () =>
          createPseudoComponent({
            tag: "span",
            innerHTML: "text",
            css: {
              // @ts-expect-error
              ":hover": { color: "red" },
            },
          }),
        /CSS Error: Pseudo-class ':hover' is not registered in the cssPseudoClassConfig/,
      );
    });

    test("rejects a pseudo-class on a tag with no cssPseudoClass key", () => {
      const NO_PSEUDO_TAG_CONFIG = {
        widget: {
          attributes: {},
          innerHTML: { include: ["#text"] },
          cssPseudoElement: [],
        },
      };
      const { createComponent: createNoPseudoComponent } = engine({
        supportedKeywords: SUPPORTED_KEYWORDS,
        htmlAttributesConfig: MOCK_SHARED_ATTRIBUTES,
        // @ts-expect-error
        htmlTagConfig: NO_PSEUDO_TAG_CONFIG,
        cssSyntaxConfig: MOCK_CSS_SYNTAX,
        cssAttributesConfig: PSEUDO_CSS_ATTRIBUTES,
        cssPseudoClassConfig: GLOBAL_PSEUDO,
        cssPropertiesConfig: PSEUDO_CSS_PROPERTIES,
        cssQueriesConfig: EMPTY_QUERIES,
      });
      assert.throws(
        () =>
          createNoPseudoComponent({
            tag: "widget",
            attributes: {},
            innerHTML: "text",
            css: {
              ":hover": { color: "red" },
            },
          }),
        /CSS Error: Pseudo-class ':hover' is not registered in the cssPseudoClassConfig/,
      );
    });
  });
});
