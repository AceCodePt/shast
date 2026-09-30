import test, { describe } from "node:test";
import assert from "node:assert";
import {
  engine,
  cssAttributeConfig,
  cssPropertiesConfig,
  htmlAttributeConfig,
  htmlTagConfig,
  SUPPORTED_KEYWORDS,
  EMPTY_QUERIES,
  EMPTY_PSEUDO_CLASSES,
  MOCK_CSS_SYNTAX,
} from "./harness.ts";

describe("implicit display from tag config at type level", () => {
  const CSS_ATTRS = cssAttributeConfig(SUPPORTED_KEYWORDS, MOCK_CSS_SYNTAX, {
    display: {
      block: { self: { width: "string", height: "string" }, children: {} },
      inline: { self: { "vertical-align": "string" }, children: {} },
      flex: { self: { "flex-direction": "'row' | 'column'" }, children: {} },
    },
  } as const);

  const CSS_PROPS = cssPropertiesConfig(SUPPORTED_KEYWORDS, MOCK_CSS_SYNTAX, {});

  const TAG_CONFIG = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRS, {
    div: {
      display: "block",
      attributes: {},
      innerHTML: { include: ["#text"] },
      cssPseudoClass: [],
      cssPseudoElement: [],
    },
    "flex-box": {
      display: "flex",
      attributes: {},
      innerHTML: { include: ["#text"] },
      cssPseudoClass: [],
      cssPseudoElement: [],
    },
    "inline-el": {
      display: "inline",
      attributes: {},
      innerHTML: { include: ["#text"] },
      cssPseudoClass: [],
      cssPseudoElement: [],
    },
  });

  const { createComponent } = engine({
    supportedKeywords: SUPPORTED_KEYWORDS,
    htmlAttributesConfig: htmlAttributeConfig(SUPPORTED_KEYWORDS, {}),
    htmlTagConfig: TAG_CONFIG,
    cssSyntaxConfig: MOCK_CSS_SYNTAX,
    cssAttributesConfig: CSS_ATTRS,
    cssPseudoClassConfig: EMPTY_PSEUDO_CLASSES,
    cssPropertiesConfig: CSS_PROPS,
    cssQueriesConfig: EMPTY_QUERIES,
  });

  test("implicit flex display unlocks flex-direction", () => {
    createComponent({ tag: "flex-box", innerHTML: "x", css: { "flex-direction": "row" } });
  });

  test("implicit block display unlocks width and height", () => {
    createComponent({ tag: "div", innerHTML: "x", css: { width: "100%", height: "auto" } });
  });

  test("implicit inline display unlocks vertical-align", () => {
    createComponent({ tag: "inline-el", innerHTML: "x", css: { "vertical-align": "middle" } });
  });

  test("explicit display in CSS overrides implicit", () => {
    // div has display: "block" in config, explicit display: "flex" should unlock flex props
    createComponent({ tag: "div", innerHTML: "x", css: { display: "flex", "flex-direction": "column" } });
  });

  test("implicit display does not unlock non-matching dependent props", () => {
    // div has display: "block", so flex-direction is rejected at runtime as
    // well as at the type wall without an explicit display.
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            // @ts-expect-error
            "flex-direction": "row",
          },
        }),
      /CSS Error: 'flex-direction' requires display: flex/,
    );
  });
});
