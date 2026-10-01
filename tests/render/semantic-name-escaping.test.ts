import test, { describe } from "node:test";
import assert from "node:assert";
import { renderComponent } from "@/engine/render/render-component.ts";
import {
  escapeAttributeValue,
  escapeText,
  semanticAttribute,
} from "@/engine/render/escape.ts";
import type { BaseHTMLTagConfig } from "@/html/tag-config/types.ts";
import type { BaseComponentStructure } from "@/engine/types.ts";

const tagConfig: BaseHTMLTagConfig = {
  div: {
    display: "block",
    attributes: {},
    innerHTML: { all: true },
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  h1: {
    display: "block",
    attributes: {},
    innerHTML: { include: ["#text"] },
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
  span: {
    display: "inline",
    attributes: {},
    innerHTML: { all: true },
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
};

function render(node: BaseComponentStructure) {
  return renderComponent(tagConfig, node);
}

/** A valid attribute name / CSS identifier after the `data-cid-` prefix. */
const VALID_ESCAPED_ATTRIBUTE = /^data-cid-[a-z0-9_-]+$/;

/** The semantic attribute on the first `<tag ...>` in the HTML. */
function htmlAttribute(html: string, tag: string): string {
  const match = html.match(new RegExp(`<${tag} (data-cid-[^\\s>]+)`));
  assert.ok(match, `expected a data-cid attribute on <${tag}> in: ${html}`);
  return match[1]!;
}

/** The attribute of the single `& > [data-cid-...]` selector in the CSS. */
function cssChildAttribute(css: string): string {
  const match = css.match(/& > \[(data-cid-[^\]]+)\]/);
  assert.ok(match, `expected a child selector in: ${css}`);
  return match[1]!;
}

describe("escapeAttributeValue escaping", () => {
  test("encodes the five HTML-significant characters", () => {
    assert.strictEqual(
      escapeAttributeValue(`&<>"'`),
      "&amp;&lt;&gt;&quot;&#39;",
    );
  });

  test("a quote can no longer close the attribute early", () => {
    assert.strictEqual(
      escapeAttributeValue('say "hi"'),
      "say &quot;hi&quot;",
    );
  });

  test("the ampersand of an entity is not double-encoded", () => {
    // Encoding `&` after the others would turn `&lt;` into `&amp;lt;`.
    assert.strictEqual(escapeAttributeValue("<"), "&lt;");
    assert.strictEqual(escapeAttributeValue("&lt;"), "&amp;lt;");
  });

  test("values needing no encoding are byte-identical", () => {
    assert.strictEqual(escapeAttributeValue("/x?y=1"), "/x?y=1");
    assert.strictEqual(escapeAttributeValue(""), "");
  });
});

describe("escapeText escaping", () => {
  test("encodes the characters that would start a tag or a reference", () => {
    assert.strictEqual(escapeText("<b>&</b>"), "&lt;b&gt;&amp;&lt;/b&gt;");
  });

  test("quotes and apostrophes are left alone", () => {
    // Encoding them would turn every apostrophe in prose into `&#39;`, and
    // neither character can change how a text node parses.
    assert.strictEqual(escapeText(`it's "fine"`), `it's "fine"`);
  });

  test("the ampersand of an entity is not double-encoded", () => {
    assert.strictEqual(escapeText("<"), "&lt;");
    assert.strictEqual(escapeText("&lt;"), "&amp;lt;");
  });

  test("plain text is byte-identical", () => {
    assert.strictEqual(escapeText("hello world"), "hello world");
    assert.strictEqual(escapeText(""), "");
  });
});

describe("semanticAttribute escaping", () => {
  test("escapes every non-[a-z0-9-] code unit, including uppercase and the marker", () => {
    assert.strictEqual(semanticAttribute("my item"), "data-cid-my_0020item");
    assert.strictEqual(semanticAttribute('a"]b'), "data-cid-a_0022_005db");
    assert.strictEqual(semanticAttribute("inner_1"), "data-cid-inner_005f1");
    assert.strictEqual(semanticAttribute("T"), "data-cid-_0054");
  });

  test("ordinary all-lowercase names are byte-identical to the raw concatenation", () => {
    assert.strictEqual(semanticAttribute("title"), "data-cid-title");
    assert.strictEqual(semanticAttribute("some-image"), "data-cid-some-image");
  });

  test("uppercase folds to _00xx so emitted attributes stay lowercase", () => {
    assert.strictEqual(semanticAttribute("Title"), "data-cid-_0054itle");
    assert.strictEqual(semanticAttribute("someImage"), "data-cid-some_0049mage");
    assert.strictEqual(semanticAttribute("someimage"), "data-cid-someimage");
    assert.ok(!/[A-Z]/.test(semanticAttribute("Title")));
    assert.ok(!/[A-Z]/.test(semanticAttribute("someImage")));
  });

  test("case-only-distinct names do not collide after lowercasing", () => {
    const title = semanticAttribute("Title");
    const lower = semanticAttribute("title");
    assert.notStrictEqual(title, lower);
    assert.notStrictEqual(title.toLowerCase(), lower.toLowerCase());
    assert.match(title, VALID_ESCAPED_ATTRIBUTE);
    assert.match(lower, VALID_ESCAPED_ATTRIBUTE);
  });

  test("an empty key still yields a valid attribute name", () => {
    assert.strictEqual(semanticAttribute(""), "data-cid-");
  });

  test("a digit-leading key is a valid identifier thanks to the prefix", () => {
    assert.strictEqual(semanticAttribute("1abc"), "data-cid-1abc");
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
      "Title",
      "TITLE",
      "someImage",
      "someimage",
      "some_image",
      "😀",
    ];
    const attributes = names.map(semanticAttribute);
    assert.strictEqual(new Set(attributes).size, names.length);
    for (const name of names) {
      if (name === "") continue;
      assert.match(semanticAttribute(name), VALID_ESCAPED_ATTRIBUTE);
    }
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

    assert.strictEqual(attribute, "data-cid-my_0020item");
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

    assert.strictEqual(attribute, "data-cid-a_0022_005db");
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
    assert.ok(html.includes("<h1 data-cid-title>"), html);
    assert.ok(css.includes("& > [data-cid-title]"), css);
  });

  test("some-image is untouched, someImage folds its uppercase", () => {
    const camel = render({
      tag: "div",
      innerHTML: { someImage: { tag: "h1", innerHTML: "x" } },
      css: { "> someImage": { color: "red" } },
    });
    assert.ok(camel.html.includes("data-cid-some_0049mage"), camel.html);
    assert.ok(camel.css.includes("& > [data-cid-some_0049mage]"), camel.css);
    assert.ok(!camel.html.includes("data-cid-someImage"), camel.html);

    const kebab = render({
      tag: "div",
      innerHTML: { "some-image": { tag: "h1", innerHTML: "x" } },
      css: { "> some-image": { color: "red" } },
    });
    assert.ok(kebab.html.includes("data-cid-some-image"), kebab.html);
    assert.ok(kebab.css.includes("& > [data-cid-some-image]"), kebab.css);
  });

  test("case-only-distinct siblings get attributes that differ after lowercasing", () => {
    const { html, css } = render({
      tag: "div",
      innerHTML: {
        Title: { tag: "h1", innerHTML: "a" },
        title: { tag: "h1", innerHTML: "b" },
      },
      css: {
        "> Title": { color: "red" },
        "> title": { color: "blue" },
      },
    });

    const attributes = [...html.matchAll(/<h1 (data-cid-[^\s>]+)>/g)].map(
      (match) => match[1]!,
    );
    assert.strictEqual(attributes.length, 2);
    const [first, second] = attributes as [string, string];
    assert.notStrictEqual(first, second);
    assert.notStrictEqual(first.toLowerCase(), second.toLowerCase());
    assert.ok(!/[A-Z]/.test(first), first);
    assert.ok(!/[A-Z]/.test(second), second);
    assert.match(first, VALID_ESCAPED_ATTRIBUTE);
    assert.match(second, VALID_ESCAPED_ATTRIBUTE);

    // Each `& > [data-cid-...]` selector addresses exactly one of the two children.
    assert.ok(css.includes(`& > [${first}]`), css);
    assert.ok(css.includes(`& > [${second}]`), css);
    assert.strictEqual(css.match(/& > \[data-cid-/g)?.length, 2);
  });
});
