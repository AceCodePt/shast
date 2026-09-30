import test, { describe } from "node:test";
import assert from "node:assert";
import { createComponent } from "./harness.ts";

// A tsyntax DSL miss names only the value's type and the DSL it failed. shast
// wraps it at the value path with the property or attribute, the element's tag,
// and the element's position in the component tree. These tests pin that
// wrapping on all three value paths (nested CSS, root CSS, HTML attribute) and
// pin that shast-authored errors are left alone.
describe("value errors carry the component path", () => {
  test("a nested CSS value error names the property, tag, and path", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: {
            item: {
              tag: "div",
              innerHTML: {
                text: {
                  tag: "span",
                  css: {
                    // @ts-expect-error `not-a-color` is not a <color>
                    color: "not-a-color",
                  },
                },
              },
            },
          },
        }),
      (error: Error) => {
        assert.match(error.message, /color/);
        assert.match(error.message, /<span>/);
        assert.match(error.message, /root > item > text/);
        assert.match(error.message, /does not match DSL "<color>"/);
        return true;
      },
    );
  });

  test("a root-level CSS value error names the property, tag, and path", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            // @ts-expect-error `not-a-color` is not a <color>
            color: "not-a-color",
          },
        }),
      (error: Error) => {
        assert.match(error.message, /color/);
        assert.match(error.message, /<div>/);
        assert.match(error.message, /at root:/);
        assert.match(error.message, /does not match DSL "<color>"/);
        return true;
      },
    );
  });

  test("an HTML attribute value error names the attribute, tag, and path", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "a",
          innerHTML: "x",
          attributes: {
            // @ts-expect-error `_blah` is not one of the declared targets
            target: "_blah",
          },
        }),
      (error: Error) => {
        assert.match(error.message, /^Attribute Error: target on <a> at root:/);
        assert.match(error.message, /does not match DSL/);
        return true;
      },
    );
  });

  test("a nested CSS value error reached through a `> child` block carries that path", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: { text: { tag: "span", innerHTML: "x" } },
          css: {
            "> text": {
              // @ts-expect-error `not-a-color` is not a <color>
              color: "not-a-color",
            },
          },
        }),
      (error: Error) => {
        assert.match(error.message, /color/);
        assert.match(error.message, /<span>/);
        assert.match(error.message, /root > text/);
        assert.match(error.message, /does not match DSL "<color>"/);
        return true;
      },
    );
  });

  test("shast-authored errors keep their wording and gain no path", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            // @ts-expect-error `colr` is a typo for `color`
            colr: "red",
          },
        }),
      (error: Error) => {
        assert.strictEqual(
          error.message,
          "CSS Error: 'colr' is not a recognized CSS attribute or property",
        );
        return true;
      },
    );

    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: { header: { tag: "h2", innerHTML: "hi" } },
          css: {
            // @ts-expect-error `headnig` is not a child of this element
            "> headnig": { color: "red" },
          },
        }),
      (error: Error) => {
        assert.strictEqual(
          error.message,
          "CSS Error: Child selector '> headnig' references child 'headnig' which is not declared in the element's innerHTML",
        );
        return true;
      },
    );
  });
});
