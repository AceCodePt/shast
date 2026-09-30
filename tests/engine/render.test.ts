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
  describe("a second registry", () => {
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
        innerHTML: { all: true },
        cssPseudoClass: [],
        cssPseudoElement: [],
      },
      span: {
        display: "inline",
        attributes: {},
        innerHTML: { include: ["#text"] },
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
    });

    test("rejects an unknown tag (it no longer passes through)", () => {
      assert.throws(
        () =>
          createProdComponent({
            // @ts-expect-error unknown tag
            tag: "unknown",
          }),
        /Structural Error: '<unknown>' is not a recognized configuration tag/,
      );
    });

    test("rejects an unknown attribute (it no longer passes through)", () => {
      assert.throws(
        () =>
          createProdComponent({
            tag: "div",
            attributes: {
              // @ts-expect-error unknown attribute
              href: "https://example.com",
            },
          }),
        /Attribute Error: Property 'href' is not a valid attribute/,
      );
    });

    test("an invalid attribute name throws at render when built directly", () => {
      // The name is pasted into markup unescaped, so the renderer must refuse
      // it even when the value never met the type or runtime wall: this is
      // output safety, the last wall before bytes leave the process.
      const comp = {
        tag: "div",
        attributes: { 'x onload="alert(1)"': "y" },
      };
      assert.throws(
        () => renderProd(comp as any),
        /Attribute Error: 'x onload="alert\(1\)"' is not a valid attribute name/,
      );
    });

    test("valid data-*/aria-* names still render when built directly", () => {
      // Names the registry does not declare but HTML allows still render; the
      // render-time check rejects only names that are not names.
      const comp = {
        tag: "div",
        attributes: { "data-x": "y", "aria-label": "z" },
      };
      const { html } = renderProd(comp as any);
      assert.strictEqual(html, `<div data-x="y" aria-label="z"></div>`);
    });

    test("rejects an invalid child selector (it no longer passes through)", () => {
      assert.throws(
        () =>
          createProdComponent({
            tag: "div",
            innerHTML: { title: { tag: "span", innerHTML: "Hello" } },
            css: {
              // @ts-expect-error unknown child selector
              "> headnig": { color: "red" },
            },
          }),
        /CSS Error: Child selector '> headnig' references child 'headnig' which is not declared/,
      );
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

    test("deeply nested valid tree renders correctly", () => {
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
