import test, { describe } from "node:test";
import assert from "node:assert";
import engine from "@/engine/index.ts";
import { cssQueriesConfig } from "@/css/queries-config/index.ts";
import { cssPropertiesConfig } from "@/css/properties-config/index.ts";
import { cssAttributeConfig } from "@/css/attribute-config/index.ts";
import { htmlAttributeConfig } from "@/html/attribute-config/index.ts";
import { htmlTagConfig } from "@/html/tag-config/index.ts";
import COMMON_SYNTAX from "@/css/syntax-config/variations/common.ts";
import { assertType, type Equal } from "../type-utils.ts";
import { SUPPORTED_KEYWORDS } from "tsyntax";

// ---------------------------------------------------------------------------
// A closed registry whose cssQueriesConfig registers exactly three query
// strings. Only these exact strings are legal keys in a css block; anything
// else starting with `@` is rejected by both walls.
// ---------------------------------------------------------------------------

const QUERY_CSS_ATTRIBUTES = cssAttributeConfig(
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

const QUERY_CSS_PROPERTIES = cssPropertiesConfig(
  SUPPORTED_KEYWORDS,
  COMMON_SYNTAX,
  {},
);

const QUERY_TAG_CONFIG = htmlTagConfig(
  SUPPORTED_KEYWORDS,
  QUERY_CSS_ATTRIBUTES,
  {
    box: {
      display: "block",
      attributes: {},
      innerHTML: "*",
      cssPseudoClass: [":hover"],
      cssPseudoElement: ["::before"],
    },
    field: {
      display: "inline-block",
      attributes: {},
      innerHTML: ["#text"],
      cssPseudoClass: [],
      cssPseudoElement: ["::placeholder"],
    },
    span: {
      display: "inline",
      attributes: {},
      innerHTML: ["#text"],
      cssPseudoClass: [],
      cssPseudoElement: [],
    },
  },
);

const QUERIES = cssQueriesConfig(COMMON_SYNTAX, [
  "@media (width < 768px)",
  "@media (width >= 1024px)",
  "@container (width > 400px)",
]);

const { createComponent, renderComponent } = engine({
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig: htmlAttributeConfig(SUPPORTED_KEYWORDS, {
    id: "string | undefined",
    class: "string | undefined",
  }),
  htmlTagConfig: QUERY_TAG_CONFIG,
  cssSyntaxConfig: COMMON_SYNTAX,
  cssAttributesConfig: QUERY_CSS_ATTRIBUTES,
  cssPseudoClassConfig: [":hover"],
  cssPropertiesConfig: QUERY_CSS_PROPERTIES,
  cssQueriesConfig: QUERIES,
});

function hashScope(html: string, tag: string): string {
  const match = html.match(new RegExp(`^<${tag} (cid-[a-z0-9]+)`));
  const token = match?.[1];
  assert.ok(token, `expected a hash scope on <${tag}> in: ${html}`);
  return token;
}

describe("css queries integration", () => {
  describe("Type Validation", () => {
    test("a registered query string is a valid top-level css block key", () => {
      createComponent({
        tag: "box",
        innerHTML: "x",
        css: {
          "@media (width < 768px)": { color: "red" },
        },
      });
    });

    test("a registered query key inside a pseudo-class block", () => {
      createComponent({
        tag: "box",
        innerHTML: "x",
        css: {
          ":hover": {
            "@media (width < 768px)": { color: "red" },
          },
        },
      });
    });

    test("a registered query key inside a pseudo-element block", () => {
      createComponent({
        tag: "box",
        innerHTML: "x",
        css: {
          "::before": {
            "@media (width < 768px)": { color: "red" },
          },
        },
      });
    });

    test("properties, pseudo-classes, and child selectors inside a query block", () => {
      createComponent({
        tag: "box",
        innerHTML: { title: { tag: "span", innerHTML: "hi" } },
        css: {
          "@media (width < 768px)": {
            color: "red",
            display: "block",
            ":hover": { color: "blue" },
            "> title": { color: "green" },
          },
        },
      });
    });

    test("a nested query key inside a query block", () => {
      createComponent({
        tag: "box",
        innerHTML: "x",
        css: {
          "@media (width < 768px)": {
            "@container (width > 400px)": { color: "red" },
          },
        },
      });
    });

    test("a query block inside a child selector block", () => {
      createComponent({
        tag: "box",
        innerHTML: { title: { tag: "span", innerHTML: "hi" } },
        css: {
          "> title": {
            "@media (width < 768px)": { color: "red" },
          },
        },
      });
    });

    test("multiple registered queries typecheck together", () => {
      createComponent({
        tag: "box",
        innerHTML: "x",
        css: {
          "@media (width < 768px)": { color: "red" },
          "@media (width >= 1024px)": { color: "blue" },
          "@container (width > 400px)": { color: "green" },
        },
      });
    });

    test("an empty query block is a valid css key", () => {
      createComponent({
        tag: "box",
        innerHTML: "x",
        css: {
          "@media (width < 768px)": {},
        },
      });
    });

    test("a class selector inside a query block composes like inside a pseudo-class", () => {
      createComponent({
        tag: "box",
        attributes: { class: "active" },
        innerHTML: "x",
        css: {
          "@media (width < 768px)": {
            "&.active": { color: "red" },
          },
        },
      });
    });
  });

  describe("Type Inference", () => {
    test("createComponent infers registered query keys in the css structure", () => {
      const comp = createComponent({
        tag: "box",
        innerHTML: "x",
        css: {
          "@media (width < 768px)": { color: "red" },
        },
      });
      assertType<
        "@media (width < 768px)" extends keyof typeof comp.css ? true : false
      >();
    });

    test("the registered query tuple drives the legal css keys", () => {
      assertType<Equal<typeof QUERIES, readonly [
        "@media (width < 768px)",
        "@media (width >= 1024px)",
        "@container (width > 400px)",
      ]>>();
    });
  });

  describe("Runtime Validation", () => {
    test("a registered query validates at runtime at the top level", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            "@media (width < 768px)": { color: "red" },
          },
        }),
      );
    });

    test("a registered query validates inside a pseudo-class and pseudo-element", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            ":hover": {
              "@media (width < 768px)": { color: "red" },
            },
            "::before": {
              "@container (width > 400px)": { color: "red" },
            },
          },
        }),
      );
    });

    test("properties, pseudo-classes, and child selectors inside a query block validate", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "box",
          innerHTML: { title: { tag: "span", innerHTML: "hi" } },
          css: {
            "@media (width < 768px)": {
              color: "red",
              ":hover": { color: "blue" },
              "> title": { color: "green" },
            },
          },
        }),
      );
    });

    test("nested query aliases validate", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            "@media (width < 768px)": {
              "@container (width > 400px)": { color: "red" },
            },
          },
        }),
      );
    });

    test("an empty query block is accepted", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            "@media (width < 768px)": {},
          },
        }),
      );
    });

    test("an unregistered query is rejected at runtime with a clear message", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              // @ts-expect-error '@phone' is not a registered query
              "@phone": { color: "red" },
            },
          }),
        /Query '@phone' is not registered/,
      );
    });

    test("an unregistered query nested inside a registered query is rejected at runtime", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              "@media (width < 768px)": {
                // @ts-expect-error '@phone' is not a registered query
                "@phone": { color: "red" },
              },
            },
          }),
        /Query '@phone' is not registered/,
      );
    });

    test("an unregistered query inside a pseudo-class block is rejected at runtime", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              ":hover": {
                // @ts-expect-error '@phone' is not a registered query
                "@phone": { color: "red" },
              },
            },
          }),
        /Query '@phone' is not registered/,
      );
    });

    test("an unregistered query inside a pseudo-element block is rejected at runtime", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              "::before": {
                // @ts-expect-error '@phone' is not a registered query
                "@phone": { color: "red" },
              },
            },
          }),
        /Query '@phone' is not registered/,
      );
    });

    test("a query key must hold a block object", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              "@media (width < 768px)": {
                // @ts-expect-error a query block must be an object
                "@container (width > 400px)": "red",
              },
            },
          }),
        /must be a CSS block object/,
      );
    });

    test("a child selector inside a query block that references a missing child is rejected", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              "@media (width < 768px)": {
                // @ts-expect-error no child named 'headnig'
                "> headnig": { color: "red" },
              },
            },
          }),
        /references child 'headnig' which is not declared/,
      );
    });
  });

  describe("Rendering", () => {
    test("a @media query key expands to a scoped @media rule", () => {
      const { html, css } = renderComponent(
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            color: "black",
            "@media (width < 768px)": { color: "red" },
          },
        }),
      );
      const scope = hashScope(html, "box");
      assert.strictEqual(
        css,
        [
          `[${scope}] {`,
          `  color: black;`,
          `  @media (width < 768px) {`,
          `    color: red;`,
          `  }`,
          `}`,
        ].join("\n"),
      );
    });

    test("a @container query key expands to a scoped @container rule, classified by prefix", () => {
      const { html, css } = renderComponent(
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            "@container (width > 400px)": { color: "red" },
          },
        }),
      );
      const scope = hashScope(html, "box");
      assert.strictEqual(
        css,
        [
          `[${scope}] {`,
          `  @container (width > 400px) {`,
          `    color: red;`,
          `  }`,
          `}`,
        ].join("\n"),
      );
    });

    test("multiple query keys render in order", () => {
      const { html, css } = renderComponent(
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            "@media (width < 768px)": { color: "red" },
            "@media (width >= 1024px)": { color: "blue" },
            "@container (width > 400px)": { color: "green" },
          },
        }),
      );
      const scope = hashScope(html, "box");
      const first = css.indexOf(`@media (width < 768px)`);
      const second = css.indexOf(`@media (width >= 1024px)`);
      const third = css.indexOf(`@container (width > 400px)`);
      assert.ok(first !== -1 && second !== -1 && third !== -1);
      assert.ok(first < second && second < third);
      assert.ok(css.startsWith(`[${scope}] {`));
    });

    test("cid scoping is preserved inside expanded query blocks", () => {
      const { html, css } = renderComponent(
        createComponent({
          tag: "box",
          innerHTML: { title: { tag: "span", innerHTML: "hi" } },
          css: {
            "@media (width < 768px)": {
              "> title": { color: "green" },
            },
          },
        }),
      );
      const scope = hashScope(html, "box");
      assert.ok(
        html.includes("<span cid-title>"),
        "child targeted through a query block carries its semantic cid",
      );
      assert.ok(
        css.includes(`& > [cid-title]`),
        "the child selector nests under the query block",
      );
      assert.ok(css.includes(`@media (width < 768px) {`));
      assert.ok(css.startsWith(`[${scope}] {`));
    });

    test("pseudo-class and pseudo-element blocks nest inside a query block", () => {
      const { html, css } = renderComponent(
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            "@media (width < 768px)": {
              ":hover": { color: "blue" },
              "::before": { content: "x" },
            },
          },
        }),
      );
      const scope = hashScope(html, "box");
      assert.strictEqual(
        css,
        [
          `[${scope}] {`,
          `  @media (width < 768px) {`,
          `    &:hover {`,
          `      color: blue;`,
          `    }`,
          `    &::before {`,
          `      content: x;`,
          `    }`,
          `  }`,
          `}`,
        ].join("\n"),
      );
    });

    test("a query block inside a pseudo-class renders scoped", () => {
      const { html, css } = renderComponent(
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            ":hover": {
              "@media (width < 768px)": { color: "red" },
            },
          },
        }),
      );
      const scope = hashScope(html, "box");
      assert.strictEqual(
        css,
        [
          `[${scope}] {`,
          `  &:hover {`,
          `    @media (width < 768px) {`,
          `      color: red;`,
          `    }`,
          `  }`,
          `}`,
        ].join("\n"),
      );
    });

    test("nested query blocks render nested", () => {
      const { html, css } = renderComponent(
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            "@media (width < 768px)": {
              "@container (width > 400px)": { color: "red" },
            },
          },
        }),
      );
      const scope = hashScope(html, "box");
      assert.strictEqual(
        css,
        [
          `[${scope}] {`,
          `  @media (width < 768px) {`,
          `    @container (width > 400px) {`,
          `      color: red;`,
          `    }`,
          `  }`,
          `}`,
        ].join("\n"),
      );
    });

    test("a class selector inside a query block renders scoped", () => {
      const { html, css } = renderComponent(
        createComponent({
          tag: "box",
          attributes: { class: "active" },
          innerHTML: "x",
          css: {
            "@media (width < 768px)": {
              "&.active": { color: "red" },
            },
          },
        }),
      );
      const scope = hashScope(html, "box");
      assert.strictEqual(
        css,
        [
          `[${scope}] {`,
          `  @media (width < 768px) {`,
          `    &.active {`,
          `      color: red;`,
          `    }`,
          `  }`,
          `}`,
        ].join("\n"),
      );
    });

    test("an empty query block elides output", () => {
      const { css } = renderComponent(
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            "@media (width < 768px)": {},
          },
        }),
      );
      assert.strictEqual(css, "");
    });

    test("identical query blocks share one scope across instances", () => {
      const card = (n: number) =>
        createComponent({
          tag: "box",
          attributes: { class: n > 1 ? "active" : "" },
          innerHTML: "x",
          css: {
            "@media (width < 768px)": { color: "red" },
          },
        });
      const one = renderComponent(card(1));
      const two = renderComponent(card(2));
      assert.strictEqual(hashScope(one.html, "box"), hashScope(two.html, "box"));
    });
  });
});