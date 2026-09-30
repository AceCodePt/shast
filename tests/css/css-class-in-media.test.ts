import test, { describe } from "node:test";
import assert from "node:assert";
import engine from "@/engine/index.ts";
import { cssQueriesConfig } from "@/css/queries-config/index.ts";
import { cssPropertiesConfig } from "@/css/properties-config/index.ts";
import { cssAttributeConfig } from "@/css/attribute-config/index.ts";
import { htmlAttributeConfig } from "@/html/attribute-config/index.ts";
import { htmlTagConfig } from "@/html/tag-config/index.ts";
import COMMON_SYNTAX from "@/css/syntax-config/variations/common.ts";
import { assertType } from "../type-utils.ts";
import { SUPPORTED_KEYWORDS } from "tsyntax";

// ---------------------------------------------------------------------------
// Class selectors inside a query block (`@media` / `@container`).
//
// The class-selector validation is the same code path used for top-level,
// pseudo-class and pseudo-element blocks; a query block only continues the
// element's scope. These tests pin the composition the task calls out: an
// `&.foo` inside a query renders scoped under the element's cid, an unknown
// class is rejected by both walls, and the class must be one the element
// declares.
// ---------------------------------------------------------------------------

const CSS_ATTRIBUTES = cssAttributeConfig(
  SUPPORTED_KEYWORDS,
  COMMON_SYNTAX,
  {
    color: "string",
    content: "string",
    display: {
      block: { self: {}, children: {} },
      inline: { self: {}, children: {} },
      "inline-block": { self: {}, children: {} },
    },
  } as const,
);

const CSS_PROPERTIES = cssPropertiesConfig(SUPPORTED_KEYWORDS, COMMON_SYNTAX, {});

const TAG_CONFIG = htmlTagConfig(SUPPORTED_KEYWORDS, CSS_ATTRIBUTES, {
  box: {
    display: "block",
    attributes: {},
    innerHTML: { all: true },
    cssPseudoClass: [":hover"],
    cssPseudoElement: ["::before"],
  },
});

const QUERIES = cssQueriesConfig(COMMON_SYNTAX, [
  "@media (width < 768px)",
  "@container (width > 400px)",
]);

const { createComponent, renderComponent } = engine({
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig: htmlAttributeConfig(SUPPORTED_KEYWORDS, {
    id: "string | undefined",
    class: "string | undefined",
  }),
  htmlTagConfig: TAG_CONFIG,
  cssSyntaxConfig: COMMON_SYNTAX,
  cssAttributesConfig: CSS_ATTRIBUTES,
  cssPseudoClassConfig: [":hover"],
  cssPropertiesConfig: CSS_PROPERTIES,
  cssQueriesConfig: QUERIES,
});

function hashScope(html: string, tag: string): string {
  const match = html.match(new RegExp(`^<${tag} (cid-[a-z0-9]+)`));
  const token = match?.[1];
  assert.ok(token, `expected a hash scope on <${tag}> in: ${html}`);
  return token;
}

describe("css class in media", () => {
  describe("Type Validation", () => {
    test("&.foo inside a @media block typechecks for a declared class", () => {
      createComponent({
        tag: "box",
        attributes: { class: "foo bar" },
        innerHTML: "x",
        css: {
          "@media (width < 768px)": {
            "&.foo": { color: "red" },
            "&.bar": { color: "blue" },
          },
        },
      });
    });

    test("&.foo inside a @container block typechecks for a declared class", () => {
      createComponent({
        tag: "box",
        attributes: { class: "foo bar" },
        innerHTML: "x",
        css: {
          "@container (width > 400px)": {
            "&.foo": { color: "red" },
          },
        },
      });
    });
  });

  describe("Type Inference", () => {
    test("the declared class drives the inferred &. keys inside a query", () => {
      const comp = createComponent({
        tag: "box",
        attributes: { class: "foo bar" },
        innerHTML: "x",
        css: {
          "@media (width < 768px)": {
            "&.foo": { color: "red" },
          },
        },
      });
      assertType<
        "&.foo" extends keyof (typeof comp)["css"]["@media (width < 768px)"]
          ? true
          : false
      >();
    });
  });

  describe("Runtime Validation", () => {
    test("&.foo inside a query validates when the class is declared", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "box",
          attributes: { class: "foo bar" },
          innerHTML: "x",
          css: {
            "@media (width < 768px)": {
              "&.foo": { color: "red" },
            },
          },
        }),
      );
    });

    test("an undeclared class in a query block is rejected at runtime", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            attributes: { class: "foo bar" },
            innerHTML: "x",
            css: {
              "@media (width < 768px)": {
                // @ts-expect-error 'baz' is not a declared class
                "&.baz": { color: "red" },
              },
            },
          }),
        /CSS Error: Class selector '&\.baz' references class 'baz' which is not declared on the element/,
      );
    });

    test("the same unknown-class rule fires outside a query block too", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            attributes: { class: "foo bar" },
            innerHTML: "x",
            css: {
              // @ts-expect-error 'baz' is not a declared class
              "&.baz": { color: "red" },
            },
          }),
        /references class 'baz' which is not declared on the element/,
      );
    });

    test("&.foo in a query is rejected when the element declares no classes", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              "@media (width < 768px)": {
                // @ts-expect-error the element declares no classes
                "&.foo": { color: "red" },
              },
            },
          }),
        /references class 'foo' which is not declared on the element/,
      );
    });
  });

  describe("Rendering", () => {
    test("an &.foo inside a @media block renders scoped under the cid", () => {
      const { html, css } = renderComponent(
        createComponent({
          tag: "box",
          attributes: { class: "foo bar" },
          innerHTML: "x",
          css: {
            "@media (width < 768px)": {
              "&.foo": { color: "red" },
            },
          },
        }),
      );
      const scope = hashScope(html, "box");
      assert.ok(html.includes('class="foo bar"'));
      assert.strictEqual(
        css,
        [
          `[${scope}] {`,
          `  @media (width < 768px) {`,
          `    &.foo {`,
          `      color: red;`,
          `    }`,
          `  }`,
          `}`,
        ].join("\n"),
      );
    });

    test("a class selector inside a @container block renders scoped", () => {
      const { html, css } = renderComponent(
        createComponent({
          tag: "box",
          attributes: { class: "foo bar" },
          innerHTML: "x",
          css: {
            "@container (width > 400px)": {
              "&.bar": { color: "blue" },
            },
          },
        }),
      );
      const scope = hashScope(html, "box");
      assert.strictEqual(
        css,
        [
          `[${scope}] {`,
          `  @container (width > 400px) {`,
          `    &.bar {`,
          `      color: blue;`,
          `    }`,
          `  }`,
          `}`,
        ].join("\n"),
      );
    });
  });
});
