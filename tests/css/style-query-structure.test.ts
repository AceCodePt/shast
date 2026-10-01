import test, { describe } from "node:test";
import assert from "node:assert";
import engine from "@/engine/index.ts";
import { cssQueriesConfig } from "@/css/queries-config/index.ts";
import { cssPropertiesConfig } from "@/css/properties-config/index.ts";
import { cssAttributeConfig } from "@/css/attribute-config/index.ts";
import { htmlAttributeConfig } from "@/html/attribute-config/index.ts";
import { htmlTagConfig } from "@/html/tag-config/index.ts";
import COMMON_SYNTAX from "@/css/syntax-config/variations/common.ts";
import { SUPPORTED_KEYWORDS } from "tsyntax";

// ---------------------------------------------------------------------------
// A `style()` container query is registered like any other query, but the
// at-rule header it emits is printed verbatim (`frame.atRule`), and the query
// builder only checks that the property starts with `--` and the value is
// non-empty. The engine re-reads the `style()` condition, checks the property
// against the properties registry, and runs the structural scan on the value.
// ---------------------------------------------------------------------------

const STYLE_QUERY_ATTRIBUTES = cssAttributeConfig(
  SUPPORTED_KEYWORDS,
  COMMON_SYNTAX,
  {
    color: "string",
    display: {
      block: { self: {}, children: {} },
      inline: { self: {}, children: {} },
    },
  } as const,
);

const STYLE_QUERY_PROPERTIES = cssPropertiesConfig(
  SUPPORTED_KEYWORDS,
  COMMON_SYNTAX,
  {
    "--x": { syntax: "<number>", inherits: false, "initial-value": "1" },
  },
);

const STYLE_QUERY_TAGS = htmlTagConfig(
  SUPPORTED_KEYWORDS,
  STYLE_QUERY_ATTRIBUTES,
  {
    box: {
      display: "block",
      attributes: {},
      innerHTML: { all: true },
      cssPseudoClass: [],
      cssPseudoElement: [],
    },
  },
);

// `cssQueriesConfig` accepts the break-out value: the property starts with `--`
// and the value is non-empty, which is all it checks. Registration is not the
// wall; the engine is.
const STYLE_QUERIES = cssQueriesConfig(COMMON_SYNTAX, [
  "@container style(--x: 1)",
  "@container style(--x: } .evil { color: red })",
  "@container style(--y: 1)",
]);

const { createComponent, renderComponent } = engine({
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig: htmlAttributeConfig(SUPPORTED_KEYWORDS, {
    id: "string | undefined",
    class: "string | undefined",
  }),
  htmlTagConfig: STYLE_QUERY_TAGS,
  cssSyntaxConfig: COMMON_SYNTAX,
  cssAttributesConfig: STYLE_QUERY_ATTRIBUTES,
  cssPseudoClassConfig: [],
  cssPropertiesConfig: STYLE_QUERY_PROPERTIES,
  cssQueriesConfig: STYLE_QUERIES,
});

function hashScope(html: string, tag: string): string {
  const match = html.match(new RegExp(`^<${tag} (data-cid-[a-z0-9]+)`));
  const token = match?.[1];
  assert.ok(token, `expected a hash scope on <${tag}> in: ${html}`);
  return token;
}

describe("style() container query structural validation", () => {
  test("a style() value carrying a structural break-out throws from createComponent", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            "@container style(--x: } .evil { color: red })": { color: "red" },
          },
        }),
      /CSS Error: '--x' value contains a top-level '\}'/,
    );
  });

  test("a style() property that is not registered throws from createComponent", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            "@container style(--y: 1)": { color: "red" },
          },
        }),
      /CSS Error: Style query property '--y' is not registered in the cssPropertiesConfig/,
    );
  });

  test("a registered style() query with a legitimate value validates", () => {
    assert.doesNotThrow(() =>
      createComponent({
        tag: "box",
        innerHTML: "x",
        css: {
          "@container style(--x: 1)": { color: "red" },
        },
      }),
    );
  });

  test("a registered style() query emits the at-rule header unchanged", () => {
    const { html, css } = renderComponent(
      createComponent({
        tag: "box",
        innerHTML: "x",
        css: {
          "@container style(--x: 1)": { color: "red" },
        },
      }),
    );
    const scope = hashScope(html, "box");
    assert.strictEqual(
      css,
      [
        `[${scope}] {`,
        `  @container style(--x: 1) {`,
        `    color: red;`,
        `  }`,
        `}`,
      ].join("\n"),
    );
  });
});
