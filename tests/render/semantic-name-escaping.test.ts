import test, { describe } from "node:test";
import assert from "node:assert";
import { renderComponent } from "@/engine/render/render-component.ts";
import { semanticAttribute } from "@/engine/render/collect-rules.ts";
import type { BaseHTMLTagConfig } from "@/html/tag-config/types.ts";
import type { BaseComponentStructure } from "@/engine/types.ts";

const tagConfig: BaseHTMLTagConfig = {
  div: {
    display: "block",
    attributes: {},
    innerHTML: "*",
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  h1: {
    display: "block",
    attributes: {},
    innerHTML: ["#text"],
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  span: {
    display: "inline",
    attributes: {},
    innerHTML: "*",
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
};

function render(node: BaseComponentStructure) {
  return renderComponent(tagConfig, node);
}

/** A valid attribute name / CSS identifier after the `cid-` prefix. */
const VALID_ESCAPED_ATTRIBUTE = /^cid-[A-Za-z0-9_-]+$/;

/** The semantic attribute on the first `<tag ...>` in the HTML. */
function htmlAttribute(html: string, tag: string): string {
  const match = html.match(new RegExp(`<${tag} (cid-[^\\s>]+)`));
  assert.ok(match, `expected a cid attribute on <${tag}> in: ${html}`);
  return match[1]!;
}

/** The attribute of the single `& > [cid-...]` selector in the CSS. */
function cssChildAttribute(css: string): string {
  const match = css.match(/& > \[(cid-[^\]]+)\]/);
  assert.ok(match, `expected a child selector in: ${css}`);
  return match[1]!;
}

describe("semanticAttribute escaping", () => {
  test("escapes every non-[A-Za-z0-9-] code unit, including the marker", () => {
    assert.strictEqual(semanticAttribute("my item"), "cid-my_0020item");
    assert.strictEqual(semanticAttribute('a"]b'), "cid-a_0022_005db");
    assert.strictEqual(semanticAttribute("inner_1"), "cid-inner_005f1");
  });

  test("ordinary names are byte-identical to the raw concatenation", () => {
    assert.strictEqual(semanticAttribute("title"), "cid-title");
    assert.strictEqual(semanticAttribute("someImage"), "cid-someImage");
    assert.strictEqual(semanticAttribute("some-image"), "cid-some-image");
  });

  test("an empty key still yields a valid attribute name", () => {
    assert.strictEqual(semanticAttribute(""), "cid-");
  });

  test("a digit-leading key is a valid identifier thanks to the prefix", () => {
    assert.strictEqual(semanticAttribute("1abc"), "cid-1abc");
    assert.match(semanticAttribute("1abc"), VALID_ESCAPED_ATTRIBUTE);
  });

  test("the encoding is injective across tricky names", () => {
    const names = [
      "my item",
      "my_0020item",
      "my\titem",
      "a\"]b",
      "a=b",
      "",
      "1abc",
      "title",
      "😀",
    ];
    const attributes = names.map(semanticAttribute);
    assert.strictEqual(new Set(attributes).size, names.length);
  });
});

describe("escaping special child names through renderComponent", () => {
  test("a key with a space emits matching, escaped attribute and selector", () => {
    const { html, css } = render({
      tag: "div",
      innerHTML: { "my item": { tag: "h1", innerHTML: "x" } },
      css: { "> my item": { color: "red" } },
    });

    const attribute = htmlAttribute(html, "h1");
    const selectorAttribute = cssChildAttribute(css);

    assert.strictEqual(attribute, "cid-my_0020item");
    assert.strictEqual(selectorAttribute, attribute);
    assert.match(attribute, VALID_ESCAPED_ATTRIBUTE);
    assert.match(selectorAttribute, VALID_ESCAPED_ATTRIBUTE);
    assert.ok(!html.includes("my item"), html);
    assert.ok(!css.includes("my item"), css);
  });

  test("a key with quotes and brackets emits matching, escaped attribute and selector", () => {
    const { html, css } = render({
      tag: "div",
      innerHTML: { 'a"]b': { tag: "h1", innerHTML: "x" } },
      css: { '> a"]b': { color: "red" } },
    });

    const attribute = htmlAttribute(html, "h1");
    const selectorAttribute = cssChildAttribute(css);

    assert.strictEqual(attribute, "cid-a_0022_005db");
    assert.strictEqual(selectorAttribute, attribute);
    assert.match(attribute, VALID_ESCAPED_ATTRIBUTE);
    assert.match(selectorAttribute, VALID_ESCAPED_ATTRIBUTE);
    assert.ok(!html.includes('a"]b'), html);
    assert.ok(!css.includes('a"]b'), css);
  });

  test("two distinct special names in one parent produce distinct attributes", () => {
    const { html, css } = render({
      tag: "div",
      innerHTML: {
        "my item": { tag: "h1", innerHTML: "a" },
        "my@item": { tag: "span", innerHTML: "b" },
      },
      css: {
        "> my item": { color: "red" },
        "> my@item": { color: "blue" },
      },
    });

    const first = htmlAttribute(html, "h1");
    const second = htmlAttribute(html, "span");
    assert.notStrictEqual(first, second);
    assert.ok(css.includes(`[${first}]`), css);
    assert.ok(css.includes(`[${second}]`), css);
  });

  test("ordinary names render byte-identically to today", () => {
    const { html, css } = render({
      tag: "div",
      innerHTML: { title: { tag: "h1", innerHTML: "t" } },
      css: { "> title": { color: "red" } },
    });
    assert.ok(html.includes("<h1 cid-title>"), html);
    assert.ok(css.includes("& > [cid-title]"), css);
  });

  test("someImage and some-image are untouched", () => {
    const camel = render({
      tag: "div",
      innerHTML: { someImage: { tag: "h1", innerHTML: "x" } },
      css: { "> someImage": { color: "red" } },
    });
    assert.ok(camel.html.includes("cid-someImage"), camel.html);
    assert.ok(camel.css.includes("& > [cid-someImage]"), camel.css);

    const kebab = render({
      tag: "div",
      innerHTML: { "some-image": { tag: "h1", innerHTML: "x" } },
      css: { "> some-image": { color: "red" } },
    });
    assert.ok(kebab.html.includes("cid-some-image"), kebab.html);
    assert.ok(kebab.css.includes("& > [cid-some-image]"), kebab.css);
  });
});
