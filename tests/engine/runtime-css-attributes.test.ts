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

describe("runtime CSS attribute validation", () => {
  const CSS_ATTRS = cssAttributeConfig(SUPPORTED_KEYWORDS, MOCK_CSS_SYNTAX, {
    color: "string",
    display: {
      block: { self: { width: "string" }, children: {} },
      inline: { self: { "vertical-align": "string" }, children: {} },
      flex: {
        self: { "flex-direction": "'row' | 'column'" },
        children: { flex: "string" },
      },
    },
  } as const);

  const CSS_PROPS = cssPropertiesConfig(SUPPORTED_KEYWORDS, MOCK_CSS_SYNTAX, {});

  const TAG_CONFIG = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRS, {
    div: {
      display: "block",
      attributes: {},
      innerHTML: "*",
      cssPseudoClass: [],
      cssPseudoElement: [],
    },
    span: {
      display: "inline",
      attributes: {},
      innerHTML: ["#text"],
      cssPseudoClass: [],
      cssPseudoElement: [],
    },
    "flex-box": {
      display: "flex",
      attributes: {},
      innerHTML: "*",
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
    cssPseudoClassConfig: [":hover"],
    cssPropertiesConfig: CSS_PROPS,
    cssQueriesConfig: EMPTY_QUERIES,
  });

  test("accepts a valid simple CSS attribute value", () => {
    assert.doesNotThrow(() =>
      createComponent({ tag: "div", innerHTML: "x", css: { color: "red" } }),
    );
  });

  test("accepts a valid complex CSS attribute value", () => {
    assert.doesNotThrow(() =>
      createComponent({ tag: "div", innerHTML: "x", css: { display: "flex" } }),
    );
  });

  test("rejects an unknown CSS attribute at runtime", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            // @ts-expect-error unknown prop is rejected at runtime
            unknownProp: "x",
          },
        }),
      /not a recognized CSS attribute or property/,
    );
  });

  test("rejects an invalid value type for a simple CSS attribute at runtime", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            // @ts-expect-error color is a string DSL
            color: 42,
          },
        }),
      /does not match DSL/,
    );
  });

  test("rejects an invalid value key for a complex CSS attribute", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            // @ts-expect-error grid is not a display value in this registry
            display: "grid",
          },
        }),
      /Invalid value 'grid' for 'display'/,
    );
  });

  test("rejects a dependent self-prop without its parent attribute value at runtime", () => {
    // flex-direction is only unlocked by display: flex, and the runtime no
    // longer reports it as an unknown prop — it says what would unlock it.
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            // @ts-expect-error flex-direction is locked under display: block
            "flex-direction": "row",
          },
        }),
      /'flex-direction' requires display: flex/,
    );
  });

  test("accepts a dependent self-prop unlocked by the parent complex value", () => {
    assert.doesNotThrow(() =>
      createComponent({
        tag: "div",
        innerHTML: "x",
        css: { display: "flex", "flex-direction": "row" },
      }),
    );
  });

  test("rejects a dependent self-prop with an invalid value type at runtime", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            display: "flex",
            // @ts-expect-error flex-direction is a 'row' | 'column' DSL
            "flex-direction": 42,
          },
        }),
      /does not match DSL/,
    );
  });

  test("resolves gate values regardless of property order", () => {
    // flex-direction must be unlocked even though it is written before display
    assert.doesNotThrow(() =>
      createComponent({
        tag: "div",
        innerHTML: "x",
        css: { "flex-direction": "row", display: "flex" },
      }),
    );
  });

  test("explains the gate and values that would unlock a locked self-prop", () => {
    // div defaults to display: block, which does not unlock flex-direction
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            // @ts-expect-error flex-direction is locked under display: block
            "flex-direction": "row",
          },
        }),
      /CSS Error: 'flex-direction' requires display: flex/,
    );
  });

  test("an explicit non-unlocking gate value still reports the locked prop", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            display: "block",
            // @ts-expect-error flex-direction is locked under display: block
            "flex-direction": "row",
          },
        }),
      /'flex-direction' requires display: flex/,
    );
  });

  // ------------------------------------------------------------------
  // Implicit display from the tag config
  // ------------------------------------------------------------------

  test("implicit display from the tag config unlocks matching self props", () => {
    // div declares display: block, so width (a block self prop) is valid even
    // without an explicit display in the css block — the runtime wall now
    // agrees with the type level (WithDefaultDisplay).
    assert.doesNotThrow(() =>
      createComponent({ tag: "div", innerHTML: "x", css: { width: "100%" } }),
    );
  });

  test("implicit display does not unlock non-matching self props", () => {
    // span declares display: inline, whose self props exclude width
    assert.throws(
      () =>
        createComponent({
          tag: "span",
          innerHTML: "x",
          css: {
            // @ts-expect-error width is locked under display: inline
            width: "100%",
          },
        }),
      /'width' requires display: block/,
    );
  });

  test("explicit display in the css overrides the implicit one", () => {
    // div defaults to block, but an explicit display: flex unlocks flex-direction
    assert.doesNotThrow(() =>
      createComponent({
        tag: "div",
        innerHTML: "x",
        css: { display: "flex", "flex-direction": "column" },
      }),
    );
  });

  // ------------------------------------------------------------------
  // Children-slot dependent props (parent gates in `> child` blocks)
  // ------------------------------------------------------------------

  test("a parent gate unlocks children-slot props inside > child blocks", () => {
    assert.doesNotThrow(() =>
      createComponent({
        tag: "div",
        innerHTML: { c: { tag: "span", innerHTML: "x" } },
        css: { display: "flex", "> c": { flex: "1" } },
      }),
    );
  });

  test("a locked children-slot prop reports 'on the parent'", () => {
    // div defaults to block, whose children slot is empty
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: { c: { tag: "span", innerHTML: "x" } },
          css: {
            "> c": {
              // @ts-expect-error flex is only unlocked by an explicit display: flex
              flex: "1",
            },
          },
        }),
      /'flex' requires display: flex on the parent/,
    );
  });

  test("children-slot props require an explicit parent gate, not the implicit one", () => {
    // flex-box defaults to display: flex, but the children slot only reads
    // gates the author explicitly wrote in this scope (mirrors the type level,
    // where CSSParent is the written css, not WithDefaultDisplay).
    assert.throws(
      () =>
        createComponent({
          tag: "flex-box",
          innerHTML: { c: { tag: "span", innerHTML: "x" } },
          css: {
            "> c": {
              // @ts-expect-error the implicit flex display does not unlock children props
              flex: "1",
            },
          },
        }),
      /'flex' requires display: flex on the parent/,
    );
  });

  test("a non-unlocking parent gate value keeps children-slot props locked", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: { c: { tag: "span", innerHTML: "x" } },
          css: {
            display: "block",
            "> c": {
              // @ts-expect-error flex is locked under display: block
              flex: "1",
            },
          },
        }),
      /'flex' requires display: flex on the parent/,
    );
  });

  test("children-slot props stay locked inside pseudo-class blocks", () => {
    // The top-level display: flex does not leak into the :hover scope; the
    // children slot there is empty (mirrors CSSParent threading at the type
    // level, which is reset per CSS scope).
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: { c: { tag: "span", innerHTML: "x" } },
          css: {
            display: "flex",
            ":hover": {
              "> c": {
                // @ts-expect-error the top-level display does not reach the :hover scope
                flex: "1",
              },
            },
          },
        }),
      /'flex' requires display: flex on the parent/,
    );
  });

  test("a child block resolves its own self props from the child's implicit display", () => {
    // `> c` targets a div (display: block), so width (a block self prop) is
    // unlocked inside the child block without an explicit display there.
    assert.doesNotThrow(() =>
      createComponent({
        tag: "div",
        innerHTML: { c: { tag: "div", innerHTML: "x" } },
        css: { "> c": { width: "100%" } },
      }),
    );
  });

  test("a child block uses its own tag's implicit display, not the parent's", () => {
    // `> c` targets a span (display: inline), whose self props exclude width
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: { c: { tag: "span", innerHTML: "x" } },
          css: {
            "> c": {
              // @ts-expect-error the child span is inline, so width stays locked
              width: "100%",
            },
          },
        }),
      /'width' requires display: block/,
    );
  });

  test("accepts a CSS custom property with a valid value", () => {
    const CSS_PROPS_WITH_VAR = cssPropertiesConfig(
      SUPPORTED_KEYWORDS,
      MOCK_CSS_SYNTAX,
      { "--my-var": { syntax: "string", inherits: false, "initial-value": "hello" } },
    );

    const { createComponent: createWithVar } = engine({
      supportedKeywords: SUPPORTED_KEYWORDS,
      htmlAttributesConfig: htmlAttributeConfig(SUPPORTED_KEYWORDS, {}),
      htmlTagConfig: TAG_CONFIG,
      cssSyntaxConfig: MOCK_CSS_SYNTAX,
      cssAttributesConfig: CSS_ATTRS,
      cssPseudoClassConfig: EMPTY_PSEUDO_CLASSES,
      cssPropertiesConfig: CSS_PROPS_WITH_VAR,
      cssQueriesConfig: EMPTY_QUERIES,
    });

    assert.doesNotThrow(() =>
      createWithVar({ tag: "div", innerHTML: "x", css: { "--my-var": "world" } }),
    );
  });

  test("rejects a CSS custom property with an invalid value type at runtime", () => {
    const CSS_PROPS_WITH_VAR = cssPropertiesConfig(
      SUPPORTED_KEYWORDS,
      MOCK_CSS_SYNTAX,
      { "--my-var": { syntax: "string", inherits: false, "initial-value": "hello" } },
    );

    const { createComponent: createWithVar } = engine({
      supportedKeywords: SUPPORTED_KEYWORDS,
      htmlAttributesConfig: htmlAttributeConfig(SUPPORTED_KEYWORDS, {}),
      htmlTagConfig: TAG_CONFIG,
      cssSyntaxConfig: MOCK_CSS_SYNTAX,
      cssAttributesConfig: CSS_ATTRS,
      cssPseudoClassConfig: EMPTY_PSEUDO_CLASSES,
      cssPropertiesConfig: CSS_PROPS_WITH_VAR,
      cssQueriesConfig: EMPTY_QUERIES,
    });

    assert.throws(
      () =>
        createWithVar({
          tag: "div",
          innerHTML: "x",
          css: {
            // @ts-expect-error --my-var is a string DSL
            "--my-var": 42,
          },
        }),
      /does not match DSL/,
    );
  });
});
