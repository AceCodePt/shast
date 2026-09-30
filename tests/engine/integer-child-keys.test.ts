import test, { describe } from "node:test";
import assert from "node:assert";
import { createComponent, renderBound } from "./harness.ts";

// JavaScript orders object keys that look like array indices (canonical
// non-negative integer strings) ahead of every other key, in ascending numeric
// order. Such a child name would silently reorder the rendered children and is
// not a usable selector handle or identifier, so `validateHtmlNode` rejects it
// at construction. The array form remains the supported way to repeat a child.
describe("integer-like child names are rejected at construction", () => {
  test("rejects a single integer-like child key, naming the key and parent", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "ul",
          innerHTML: { 1: { tag: "li", innerHTML: "x" } },
        }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /Child name '1' on <ul>/);
        assert.match(error.message, /child names must be valid identifiers/);
        return true;
      },
    );
  });

  test("rejects an integer-like child key nested inside a subtree", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: {
            wrapper: {
              tag: "ul",
              innerHTML: { 0: { tag: "li", innerHTML: "x" } },
            },
          },
        }),
      /Child name '0' on <ul>/,
    );
  });

  test("rejects the largest array-index key", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "ul",
          innerHTML: { 4294967294: { tag: "li", innerHTML: "x" } },
        }),
      /Child name '4294967294' on <ul>/,
    );
  });

  test("non-canonical numeric strings are not array indices and still construct", () => {
    for (const key of ["-1", "01", "1.5", "+1", "1e2"]) {
      const component = createComponent({
        tag: "ul",
        innerHTML: { [key]: { tag: "li", innerHTML: "x" } },
      });
      assert.deepStrictEqual(component, {
        tag: "ul",
        innerHTML: { [key]: { tag: "li", innerHTML: "x" } },
      });
    }
  });

  test("2^32 - 1 is not an array index and still constructs", () => {
    const component = createComponent({
      tag: "ul",
      innerHTML: { 4294967295: { tag: "li", innerHTML: "x" } },
    });
    assert.deepStrictEqual(component, {
      tag: "ul",
      innerHTML: { 4294967295: { tag: "li", innerHTML: "x" } },
    });
  });

  test("a non-integer key with a space still constructs and renders", () => {
    const component = createComponent({
      tag: "ul",
      innerHTML: { "my item": { tag: "li", innerHTML: "x" } },
    });
    const { html } = renderBound(component);
    assert.strictEqual(html, "<ul><li>x</li></ul>");
  });

  test("a spaced key is still targetable by a > selector", () => {
    const component = createComponent({
      tag: "ul",
      innerHTML: { "my item": { tag: "li", innerHTML: "x" } },
      css: { "> my item": { display: "block" } },
    });
    const { html, css } = renderBound(component);
    assert.ok(html.includes("<li cid-my_0020item>"), html);
    assert.ok(css.includes("[cid-my_0020item]"), css);
  });

  test("array children are unaffected", () => {
    const component = createComponent({
      tag: "ul",
      innerHTML: {
        items: [
          { tag: "li", innerHTML: "a" },
          { tag: "li", innerHTML: "b" },
        ],
      },
    });
    const { html } = renderBound(component);
    assert.strictEqual(html, "<ul><li>a</li><li>b</li></ul>");
  });

  test("ordinary string keys render in authored order", () => {
    const component = createComponent({
      tag: "div",
      innerHTML: {
        first: { tag: "p", innerHTML: "1" },
        second: { tag: "p", innerHTML: "2" },
      },
    });
    const { html } = renderBound(component);
    assert.strictEqual(html, "<div><p>1</p><p>2</p></div>");
  });
});
