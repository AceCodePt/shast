import test, { describe } from "node:test";
import assert from "node:assert";
import { createComponent, renderBound } from "./harness.ts";

// End-to-end proof on the shipped common tier: the legacy comma-separated
// colour forms clear both walls (the type wall at `createComponent`, the
// runtime DSL wall it dispatches to) and render verbatim. The space-separated
// forms stay accepted side by side.
describe("legacy comma-separated colour forms (end-to-end)", () => {
  for (const color of [
    "rgb(255, 0, 0)",
    "rgba(255, 0, 0, 0.5)",
    "hsl(0, 100%, 50%)",
    "hsla(0, 100%, 50%, 0.5)",
    "rgb(255 0 0)",
  ] as const) {
    test(`builds and renders ${color} verbatim`, () => {
      const component = createComponent({
        tag: "div",
        innerHTML: "x",
        css: { color },
      });
      const { css } = renderBound(component);
      assert.ok(css.includes(`color: ${color};`), css);
    });
  }

  test("rgb(255, 0) is rejected at both walls", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            // @ts-expect-error `rgb(255, 0)` is not a <color>
            color: "rgb(255, 0)",
          },
        }),
      /does not match DSL "<color>"/,
    );
  });
});
