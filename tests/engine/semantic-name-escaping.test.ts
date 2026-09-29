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
    assert.ok(html.includes("<p cid-my_0020item>"), html);
    assert.ok(css.includes("& > [cid-my_0020item]"), css);
  });

  test("a key with quotes and brackets is accepted and rendered escaped", () => {
    const component = createComponent({
      tag: "div",
      innerHTML: { 'a"]b': { tag: "p", innerHTML: "x" } },
      css: { '> a"]b': { display: "block" } },
    });
    const { html, css } = renderBound(component);
    assert.ok(html.includes("<p cid-a_0022_005db>"), html);
    assert.ok(css.includes("& > [cid-a_0022_005db]"), css);
  });

  test("an empty key is accepted and rendered with the bare prefix", () => {
    const component = createComponent({
      tag: "div",
      innerHTML: { "": { tag: "p", innerHTML: "x" } },
      css: { "> ": { display: "block" } },
    });
    const { html, css } = renderBound(component);
    assert.ok(html.includes("<p cid->"), html);
    assert.ok(css.includes("& > [cid-]"), css);
  });
});
