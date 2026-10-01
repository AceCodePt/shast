import test, { describe } from "node:test";
import assert from "node:assert";
import { SUPPORTED_KEYWORDS } from "tsyntax";
import engine from "@/engine/index.ts";
import { cssPropertiesConfig } from "@/css/properties-config/index.ts";
import HTML_GLOBAL_ATTRIBUTES_CONFIG from "@/html/attribute-config/variations/common.ts";
import COMMON_TAGS from "@/html/tag-config/variations/common.ts";
import COMMON_SYNTAX from "@/css/syntax-config/variations/common.ts";
import COMMON_ATTRIBUTES from "@/css/attribute-config/variations/common.ts";
import COMMON_PSEUDO from "@/css/pseudo-class-config/variations/common.ts";
import COMMON_QUERIES from "@/css/queries-config/variations/common.ts";

// Both walls of the shipped `common` tier, for the everyday tags added on top
// of the original curated set. Positive rows must compile (the type wall) and
// not throw at runtime; negative rows carry `@ts-expect-error` so `pnpm check`
// fails if the type wall ever stops rejecting them (an unused directive is
// itself a compile error - TS2578 is the tripwire).
const { createComponent, renderComponent } = engine({
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig: HTML_GLOBAL_ATTRIBUTES_CONFIG,
  htmlTagConfig: COMMON_TAGS,
  cssSyntaxConfig: COMMON_SYNTAX,
  cssAttributesConfig: COMMON_ATTRIBUTES,
  cssPseudoClassConfig: COMMON_PSEUDO,
  cssPropertiesConfig: cssPropertiesConfig(SUPPORTED_KEYWORDS, COMMON_SYNTAX, {}),
  cssQueriesConfig: COMMON_QUERIES,
});

const ORIGINAL_TAGS = [
  "a",
  "article",
  "br",
  "button",
  "div",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "img",
  "input",
  "label",
  "li",
  "main",
  "nav",
  "ol",
  "p",
  "section",
  "span",
  "table",
  "tbody",
  "td",
  "textarea",
  "th",
  "thead",
  "tr",
  "ul",
];

const ADDED_TAGS = [
  "strong",
  "em",
  "b",
  "i",
  "code",
  "pre",
  "blockquote",
  "select",
  "option",
  "details",
  "summary",
  "dialog",
  "hr",
  "small",
  "figure",
];

describe("shipped common tier: everyday tags", () => {
  test("registers exactly the original set plus the fifteen reported tags", () => {
    assert.deepStrictEqual(
      [...Object.keys(COMMON_TAGS)].sort(),
      [...ORIGINAL_TAGS, ...ADDED_TAGS].sort(),
    );
  });

  test("the original tags keep their declared displays", () => {
    assert.strictEqual(COMMON_TAGS.a.display, "inline");
    assert.strictEqual(COMMON_TAGS.ul.display, "block");
    assert.strictEqual(COMMON_TAGS.li.display, "list-item");
    assert.strictEqual(COMMON_TAGS.table.display, "table");
    assert.strictEqual(COMMON_TAGS.td.display, "table-cell");
    assert.strictEqual(COMMON_TAGS.button.display, "inline-block");
  });

  describe("each added tag is accepted at both walls", () => {
    test("inline formatting and small", () => {
      assert.doesNotThrow(() => createComponent({ tag: "strong", innerHTML: "s" }));
      assert.doesNotThrow(() => createComponent({ tag: "em", innerHTML: "e" }));
      assert.doesNotThrow(() => createComponent({ tag: "b", innerHTML: "b" }));
      assert.doesNotThrow(() => createComponent({ tag: "i", innerHTML: "i" }));
      assert.doesNotThrow(() => createComponent({ tag: "code", innerHTML: "c" }));
      assert.doesNotThrow(() => createComponent({ tag: "small", innerHTML: "s" }));
    });

    test("block and void tags", () => {
      assert.doesNotThrow(() => createComponent({ tag: "pre", innerHTML: "p" }));
      assert.doesNotThrow(() =>
        createComponent({
          tag: "blockquote",
          attributes: { cite: "https://example.com" },
          innerHTML: { body: { tag: "p", innerHTML: "quoted" } },
        }),
      );
      assert.doesNotThrow(() => createComponent({ tag: "hr" }));
      assert.doesNotThrow(() =>
        createComponent({
          tag: "figure",
          innerHTML: { art: { tag: "img", attributes: { src: "./a.png", alt: "" } } },
        }),
      );
      assert.doesNotThrow(() =>
        createComponent({
          tag: "dialog",
          attributes: { open: true },
          innerHTML: { body: { tag: "p", innerHTML: "hi" } },
        }),
      );
    });

    test("details and summary", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "details",
          attributes: { open: true },
          innerHTML: {
            label: { tag: "summary", innerHTML: "More" },
            body: { tag: "p", innerHTML: "hidden" },
          },
        }),
      );
      assert.doesNotThrow(() => createComponent({ tag: "summary", innerHTML: "More" }));
    });

    test("select and option", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "select",
          attributes: {
            name: "choice",
            required: true,
            multiple: true,
            size: 2,
            form: "f",
          },
          innerHTML: {
            first: {
              tag: "option",
              attributes: { value: "1", selected: true, label: "One" },
              innerHTML: "One",
            },
            second: { tag: "option", attributes: { value: "2", disabled: true }, innerHTML: "Two" },
          },
        }),
      );
      assert.doesNotThrow(() => createComponent({ tag: "option", innerHTML: "leaf" }));
    });
  });

  describe("phrasing content reaches the phrasing parents", () => {
    test("p > strong/em/b/i/code/small", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "p",
          innerHTML: {
            s: { tag: "strong", innerHTML: "s" },
            e: { tag: "em", innerHTML: "e" },
            b: { tag: "b", innerHTML: "b" },
            i: { tag: "i", innerHTML: "i" },
            c: { tag: "code", innerHTML: "c" },
            sm: { tag: "small", innerHTML: "sm" },
          },
        }),
      );
    });

    test("headings, a, label and button accept the added phrasing tags", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "h1",
          innerHTML: { s: { tag: "strong", innerHTML: "s" }, c: { tag: "code", innerHTML: "c" } },
        }),
      );
      assert.doesNotThrow(() =>
        createComponent({
          tag: "a",
          attributes: { href: "./x" },
          innerHTML: { e: { tag: "em", innerHTML: "e" }, b: { tag: "b", innerHTML: "b" } },
        }),
      );
      assert.doesNotThrow(() =>
        createComponent({
          tag: "label",
          innerHTML: { i: { tag: "i", innerHTML: "i" }, sm: { tag: "small", innerHTML: "sm" } },
        }),
      );
      assert.doesNotThrow(() =>
        createComponent({
          tag: "button",
          innerHTML: { s: { tag: "strong", innerHTML: "s" }, c: { tag: "code", innerHTML: "c" } },
        }),
      );
    });

    test("added phrasing containers nest one another", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "strong",
          innerHTML: {
            e: { tag: "em", innerHTML: "e" },
            b: { tag: "b", innerHTML: "b" },
            i: { tag: "i", innerHTML: "i" },
            c: { tag: "code", innerHTML: "c" },
            sm: { tag: "small", innerHTML: "sm" },
          },
        }),
      );
    });
  });

  describe("end-to-end render", () => {
    test("a select of options prints its markup", () => {
      const component = createComponent({
        tag: "select",
        attributes: { name: "choice" },
        innerHTML: {
          first: { tag: "option", attributes: { value: "1" }, innerHTML: "One" },
          second: { tag: "option", attributes: { value: "2" }, innerHTML: "Two" },
        },
      });
      const { html } = renderComponent(component);
      assert.ok(html.includes("<select"), html);
      assert.ok(html.includes("<option"), html);
      assert.ok(html.includes("One"), html);
      assert.ok(html.includes("Two"), html);
    });

    test("a p of strong prints its markup", () => {
      const component = createComponent({
        tag: "p",
        innerHTML: { bold: { tag: "strong", innerHTML: "hello" } },
      });
      const { html } = renderComponent(component);
      assert.ok(html.includes("<p"), html);
      assert.ok(html.includes("<strong"), html);
      assert.ok(html.includes("hello"), html);
    });
  });

  describe("negative rows stay rejected at both walls", () => {
    test("p > div is a type error and a runtime throw", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "p",
            innerHTML: {
              block: {
                // @ts-expect-error div is not a permitted child of p
                tag: "div",
              },
            },
          }),
        /Structural Error: '<div>' is not a permitted child of <p>/,
      );
    });

    test("the added block tags stay out of p and headings", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "p",
            innerHTML: {
              child: {
                // @ts-expect-error pre is not a permitted child of p
                tag: "pre",
                innerHTML: "x",
              },
            },
          }),
        /Structural Error: '<pre>' is not a permitted child of <p>/,
      );
      assert.throws(
        () =>
          createComponent({
            tag: "h2",
            innerHTML: {
              child: {
                // @ts-expect-error select is not a permitted child of h2
                tag: "select",
              },
            },
          }),
        /Structural Error: '<select>' is not a permitted child of <h2>/,
      );
    });

    test("an unregistered tag is a type error and a runtime throw", () => {
      assert.throws(
        () =>
          createComponent({
            // @ts-expect-error sectionz is not in the registry
            tag: "sectionz",
          }),
        /Structural Error: '<sectionz>' is not a recognized configuration tag in your registry/,
      );
    });

    test("option is a text-only leaf", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "option",
            innerHTML: {
              nested: {
                // @ts-expect-error option admits only text
                tag: "span",
              },
            },
          }),
        /Structural Error: '<span>' is not a permitted child of <option>/,
      );
    });

    test("hr is a void tag", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "hr",
            // @ts-expect-error hr admits no innerHTML
            innerHTML: "x",
          }),
        /Validation Error: Tag '<hr>' is configured as a void element/,
      );
    });
  });
});
