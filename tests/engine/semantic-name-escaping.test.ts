import test, { describe } from "node:test";
import assert from "node:assert";
import { createComponent, renderBound } from "./harness.ts";

// The type layer constrains nothing about an innerHTML record's keys, and the
// runtime wall iterates `Object.values(innerHTML)` while `validateCSS` only
// checks membership. These tests pin that: a special-character key both
// type-checks through `createComponent` and passes the runtime wall, then
// renders through the one escaping seam (`semanticAttribute`).
describe("special child names pass both walls", () => {
  test("a key with a space is accepted and rendered escaped", () => {
    const component = createComponent({
      tag: "div",
      innerHTML: { "my item": { tag: "p", innerHTML: "x" } },
      css: { "> my item": { display: "block" } },
    });
    const { html, css } = renderBound(component);
    assert.ok(html.includes("<p data-cid-my_0020item>"), html);
    assert.ok(css.includes("& > [data-cid-my_0020item]"), css);
  });

  test("a key with quotes and brackets is accepted and rendered escaped", () => {
    const component = createComponent({
      tag: "div",
      innerHTML: { 'a"]b': { tag: "p", innerHTML: "x" } },
      css: { '> a"]b': { display: "block" } },
    });
    const { html, css } = renderBound(component);
    assert.ok(html.includes("<p data-cid-a_0022_005db>"), html);
    assert.ok(css.includes("& > [data-cid-a_0022_005db]"), css);
  });

  test("an empty key is accepted and rendered with the bare prefix", () => {
    const component = createComponent({
      tag: "div",
      innerHTML: { "": { tag: "p", innerHTML: "x" } },
      css: { "> ": { display: "block" } },
    });
    const { html, css } = renderBound(component);
    assert.ok(html.includes("<p data-cid->"), html);
    assert.ok(css.includes("& > [data-cid-]"), css);
  });

  test("case-only-distinct keys stay distinct after HTML lowercasing", () => {
    const component = createComponent({
      tag: "div",
      innerHTML: {
        Title: { tag: "p", innerHTML: "a" },
        title: { tag: "p", innerHTML: "b" },
      },
      css: {
        "> Title": { display: "block" },
        "> title": { display: "block" },
      },
    });
    const { html, css } = renderBound(component);
    const attributes = [...html.matchAll(/<p (data-cid-[^\s>]+)>/g)].map(
      (match) => match[1]!,
    );
    assert.strictEqual(attributes.length, 2);
    const [upper, lower] = attributes as [string, string];
    assert.notStrictEqual(upper.toLowerCase(), lower.toLowerCase());
    const VALID_ESCAPED_ATTRIBUTE = /^data-cid-[a-z0-9_-]+$/;
    for (const attribute of attributes) {
      assert.match(attribute, VALID_ESCAPED_ATTRIBUTE);
    }
    assert.ok(css.includes(`& > [${upper}]`), css);
    assert.ok(css.includes(`& > [${lower}]`), css);
  });
});
