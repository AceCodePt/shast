import test, { describe } from "node:test";
import assert from "node:assert";
import {
  engine,
  renderComponent,
  cssPropertiesConfig,
  cssAttributeConfig,
  htmlAttributeConfig,
  htmlTagConfig,
  HTML_TAGS_CONFIG,
  SUPPORTED_KEYWORDS,
  EMPTY_QUERIES,
  EMPTY_PSEUDO_CLASSES,
  MOCK_CSS_ATTR_CONFIG,
  MOCK_CSS_SYNTAX,
  createComponent,
  renderBound,
  cssProperties,
} from "./harness.ts";

describe("engine", () => {
  test("renderComponent is bound to the engine config", () => {
    const component = createComponent({
      tag: "div",
      innerHTML: { title: { tag: "h1", innerHTML: "hello" } },
      css: { display: "block", width: "100%", "> title": { color: "inherit" } },
    });

    // Bound call (node only) must equal the unbound call with explicit config.
    const bound = renderBound(component);
    const direct = renderComponent(HTML_TAGS_CONFIG, component);
    assert.deepStrictEqual(bound, direct);

    assert.match(bound.html, /^<div cid-[a-z0-9]+>/);
    assert.ok(bound.html.includes("<h1 cid-title"));
    assert.ok(bound.html.includes("hello"));
    assert.ok(bound.css.includes("width: 100%;"));
  });

  test("implicit display from the tag config is honored at runtime with the real registry", () => {
    // <div> declares display: block, and `width` is a block self prop — so it
    // validates without an explicit display in the css block.
    assert.doesNotThrow(() =>
      createComponent({
        tag: "div",
        innerHTML: "hello",
        css: { width: "100%" },
      }),
    );

    // A flex-only prop stays locked under the implicit block display, and the
    // error explains what would unlock it (matching the type-level message).
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: "hello",
          css: {
            // @ts-expect-error flex-direction is locked under display: block
            "flex-direction": "row",
          },
        }),
      /CSS Error: 'flex-direction' requires display: flex \| inline-flex/,
    );
  });

  test("void elements from the real config self-close", () => {
    const component = createComponent({
      tag: "img",
      attributes: { src: "a.png", alt: "" },
    });
    const { html } = renderBound(component);
    // A root void element with no css and no semantic name gets no identifier.
    assert.strictEqual(html, `<img src="a.png" alt="">`);
    assert.ok(!html.includes("</img>"));
  });

  test("cssProperties renders the @property config", () => {
    assert.ok(cssProperties.includes("@property --_a"));
  });
});

describe("createComponent (engine)", () => {
  describe("production mode", () => {
    const PROD_CSS_ATTRIBUTES = cssAttributeConfig(
      SUPPORTED_KEYWORDS,
      MOCK_CSS_SYNTAX,
      {
        width: "string",
        color: "string",
        display: {
          block: { self: {}, children: {} },
          inline: { self: {}, children: {} },
        },
      } as const,
    );
    const PROD_CSS_PROPERTIES = cssPropertiesConfig(
      SUPPORTED_KEYWORDS,
      MOCK_CSS_SYNTAX,
      {},
    );

    const PROD_TAG_CONFIG = htmlTagConfig(SUPPORTED_KEYWORDS, MOCK_CSS_ATTR_CONFIG, {
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
    });

    const {
      createComponent: createProdComponent,
      renderComponent: renderProd,
    } = engine({
      supportedKeywords: SUPPORTED_KEYWORDS,
      htmlAttributesConfig: htmlAttributeConfig(SUPPORTED_KEYWORDS, {
        id: "string | undefined",
        class: "string | undefined",
      }),
      htmlTagConfig: PROD_TAG_CONFIG,
      cssSyntaxConfig: MOCK_CSS_SYNTAX,
      cssAttributesConfig: PROD_CSS_ATTRIBUTES,
      cssPseudoClassConfig: EMPTY_PSEUDO_CLASSES,
      cssPropertiesConfig: PROD_CSS_PROPERTIES,
      cssQueriesConfig: EMPTY_QUERIES,
    }, { skipValidation: true });

    test("skips validation — invalid data passes through", () => {
      const comp = createProdComponent({
        // @ts-expect-error unknown tag passes through in production mode
        tag: "unknown",
      });
      assert.deepStrictEqual(comp, { tag: "unknown" });
    });

    test("skips attribute validation — unknown attributes pass through", () => {
      const comp = createProdComponent({
        tag: "div",
        attributes: {
          // @ts-expect-error unknown attribute passes through in production mode
          href: "https://example.com",
        },
      });
      assert.deepStrictEqual(comp, {
        tag: "div",
        attributes: { href: "https://example.com" },
      });
    });

    test("invalid attribute name throws at render, even with skipValidation", () => {
      // `skipValidation` makes createComponent a pass-through, but the name is
      // pasted into markup unescaped, so the renderer must still refuse it:
      // this is output safety, the last wall before bytes leave the process.
      const comp = createProdComponent({
        tag: "div",
        attributes: {
          // @ts-expect-error an injected attribute name survives validation
          'x onload="alert(1)"': "y",
        },
      });
      assert.throws(
        () => renderProd(comp),
        /Attribute Error: 'x onload="alert\(1\)"' is not a valid attribute name/,
      );
    });

    test("valid data-*/aria-* names still render with skipValidation", () => {
      // Names the registry does not declare but HTML allows still render; the
      // render-time check rejects only names that are not names.
      const comp = createProdComponent({
        tag: "div",
        attributes: {
          // @ts-expect-error unknown to the registry, but a legal HTML name
          "data-x": "y",
          "aria-label": "z",
        },
      });
      const { html } = renderProd(comp);
      assert.strictEqual(html, `<div data-x="y" aria-label="z"></div>`);
    });

    test("skips CSS child selector check — invalid child selector passes through", () => {
      const comp = createProdComponent({
        tag: "div",
        innerHTML: { title: { tag: "span", innerHTML: "Hello" } },
        css: {
          // @ts-expect-error unknown child selector passes through in production mode
          "> headnig": { color: "red" },
        },
      });
      assert.deepStrictEqual(comp, {
        tag: "div",
        innerHTML: { title: { tag: "span", innerHTML: "Hello" } },
        css: { "> headnig": { color: "red" } },
      });
    });

    test("valid components still render correctly", () => {
      const comp = createProdComponent({
        tag: "div",
        innerHTML: { title: { tag: "span", innerHTML: "hello" } },
      css: { display: "block", width: "100%", "> title": { color: "inherit" } },
      });
      const { html, css } = renderProd(comp);
      assert.match(html, /^<div cid-[a-z0-9]+>/);
      assert.ok(html.includes("<span cid-title"));
      assert.ok(html.includes("hello"));
      assert.ok(css.includes("width: 100%;"));
    });

    test("deeply nested valid tree renders correctly in production mode", () => {
      const comp = createProdComponent({
        tag: "div",
        innerHTML: {
          level1: {
            tag: "div",
            innerHTML: {
              level2: [
                {
                  tag: "div",
                  innerHTML: {
                    level3: [{ tag: "span", innerHTML: "deep" }],
                  },
                },
              ],
            },
          },
        },
        css: {
          "> level1": {
            "> level2": {
              "> level3": { color: "transparent" },
            },
          },
        },
      });
      const { html, css } = renderProd(comp);
      assert.ok(html.includes("cid-level1"));
      assert.ok(html.includes("cid-level2"));
      assert.ok(html.includes("cid-level3"));
      assert.ok(css.includes("[cid-level1]"));
      assert.ok(css.includes("[cid-level2]"));
      assert.ok(css.includes("[cid-level3]"));
    });
  });
});
