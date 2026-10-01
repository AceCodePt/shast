import test, { describe } from "node:test";
import assert from "node:assert";
import { createComponent, createMockComponent, renderBound } from "./harness.ts";

describe("createComponent (engine)", () => {
  describe("Array innerHTML Children", () => {
    describe("Type Validation", () => {
      test("accepts array of child components", () => {
        createMockComponent({
          tag: "div",
          innerHTML: {
            items: [{ tag: "div" }, { tag: "div" }],
          },
        });
      });

      test("accepts mixed single child and array child in the same innerHTML", () => {
        createMockComponent({
          tag: "div",
          innerHTML: {
            single: { tag: "div" },
            multiple: [{ tag: "div" }, { tag: "div" }],
          },
        });
      });

      test("accepts empty array where innerHTML allows it", () => {
        createMockComponent({
          tag: "div",
          innerHTML: {
            items: [],
          },
        });
      });

      test("accepts array of text nodes when parent allows #text", () => {
        createMockComponent({
          tag: "p",
          innerHTML: {
            texts: ["a", "b"],
          },
        });
      });

      test("accepts mixed text and component children in array", () => {
        createMockComponent({
          tag: "div",
          innerHTML: {
            items: ["text", { tag: "div" }],
          },
        });
      });

      test("CSS > selector targets array child at type level", () => {
        createComponent({
          tag: "div",
          innerHTML: {
            items: [{ tag: "span" }, { tag: "span" }],
          },
          css: {
            "> items": { color: "inherit" },
          },
        });
      });

      test("CSS nested > selectors through array child at type level", () => {
        createComponent({
          tag: "div",
          innerHTML: {
            wrapper: [
              {
                tag: "div",
                innerHTML: {
                  inner: { tag: "span" },
                },
              },
            ],
          },
          css: {
            "> wrapper": {
              "> inner": { color: "inherit" },
            },
          },
        });
      });

      test("CSS targeting with mixed single and array children at type level", () => {
        createComponent({
          tag: "div",
          innerHTML: {
            single: { tag: "span" },
            multiple: [{ tag: "span" }, { tag: "span" }],
          },
          css: {
            "> single": { color: "inherit" },
            "> multiple": { color: "inherit" },
          },
        });
      });

      // Regression: a `> child` block targeting an array of children used to
      // collapse to `never` whenever the entries' text differed, because
      // TypeScript treats a differing `innerHTML` as a conflicting
      // discriminant. The runtime applied the tag's implicit `display`
      // regardless, so the two walls drifted exactly in the common case (array
      // items almost always differ in text). See `SettleArrayChild`. The accept
      // side of this regression is asserted in the "Render array children"
      // block below (which also runs the case to completion).
      test("the settled array node still rejects props the agreed display does not unlock", () => {
        assert.throws(
          () => {
            createComponent({
              tag: "ul",
              innerHTML: {
                item: [
                  { tag: "li", innerHTML: "a" },
                  { tag: "li", innerHTML: "b" },
                ],
              },
              css: {
                "> item": {
                  // @ts-expect-error flex-direction needs display: flex, which li does not default to
                  "flex-direction": "row",
                },
              },
            });
          },
          /'flex-direction' requires display: flex/,
        );
      });

      test("arrays whose tags disagree still unlock nothing", () => {
        // div is block, span is inline; no single implicit display applies, so
        // a block-only prop is rejected -- matching the runtime.
        assert.throws(
          () => {
            createComponent({
              tag: "div",
              innerHTML: {
                item: [
                  { tag: "div", innerHTML: "a" },
                  { tag: "span", innerHTML: "b" },
                ],
              },
              css: {
                "> item": {
                  // @ts-expect-error no single display applies to the array
                  width: "2px",
                },
              },
            });
          },
          /'width' requires display: block/,
        );
      });

      test("a > child block on a nested array with differing text settles through both levels", () => {
        createComponent({
          tag: "ul",
          innerHTML: {
            item: [
              {
                tag: "li",
                innerHTML: {
                  sub: [
                    { tag: "li", innerHTML: "x" },
                    { tag: "li", innerHTML: "y" },
                  ],
                },
              },
              {
                tag: "li",
                innerHTML: {
                  sub: [
                    { tag: "li", innerHTML: "p" },
                    { tag: "li", innerHTML: "q" },
                  ],
                },
              },
            ],
          },
          css: { "> item": { "> sub": { "margin-top": "2px" } } },
        });
      });

      test("CSS through array child with partial innerHTML overlap at type level", () => {
        createComponent({
          tag: "div",
          innerHTML: {
            items: [
              { tag: "li", innerHTML: { inner1: { tag: "div" } } },
              {
                tag: "li",
                innerHTML: {
                  inner1: {
                    tag: "div",
                    innerHTML: { inner3: { tag: "div" } },
                  },
                  inner2: { tag: "div" },
                },
              },
            ],
          },
          css: {
            display: "block",
            width: "100px",
            "> items": {
              "> inner2": {},
              "> inner1": {
                "> inner3": {},
              },
            },
          },
        });
      });

      test("rejects array with invalid child tag", () => {
        assert.throws(
          () =>
            createMockComponent({
              tag: "ul",
              // @ts-expect-error
              innerHTML: {
                items: [{ tag: "li" }, { tag: "div" }],
              },
            }),
          /Structural Error:/,
        );
      });

      test("rejects text in array when parent does not allow #text", () => {
        assert.throws(
          () =>
            createMockComponent({
              tag: "ul",
              // @ts-expect-error
              innerHTML: {
                items: ["text"],
              },
            }),
          /Validation Error:/,
        );
      });
    });

    describe("Runtime Validation", () => {
      test("accepts array of valid child components", () => {
        const config = createMockComponent({
          tag: "ul",
          innerHTML: {
            items: [{ tag: "li" }, { tag: "li" }],
          },
        });
        assert.deepStrictEqual(config, {
          tag: "ul",
          innerHTML: {
            items: [{ tag: "li" }, { tag: "li" }],
          },
        });
      });

      test("rejects array with invalid child tag at runtime", () => {
        assert.throws(
          () =>
            createMockComponent({
              tag: "ul",
              // @ts-expect-error
              innerHTML: {
                items: [{ tag: "li" }, { tag: "div" }],
              },
            }),
          /Structural Error: '<div>' is not a permitted child of <ul>/,
        );
      });

      test("rejects text in array when parent does not allow #text", () => {
        assert.throws(
          () =>
            createMockComponent({
              tag: "ul",
              // @ts-expect-error
              innerHTML: {
                items: ["text"],
              },
            }),
          /Validation Error: Tag '<ul>' innerHTML cannot contain a string without the #text/,
        );
      });

      test("accepts empty array", () => {
        const config = createMockComponent({
          tag: "ul",
          innerHTML: {
            items: [],
          },
        });
        assert.deepStrictEqual(config, {
          tag: "ul",
          innerHTML: {
            items: [],
          },
        });
      });

      test("accepts array of text nodes when parent allows #text", () => {
        const config = createMockComponent({
          tag: "p",
          innerHTML: {
            texts: ["hello", "world"],
          },
        });
        assert.deepStrictEqual(config, {
          tag: "p",
          innerHTML: {
            texts: ["hello", "world"],
          },
        });
      });

      test("accepts mixed text and components in array", () => {
        const config = createMockComponent({
          tag: "li",
          innerHTML: {
            items: ["hello", { tag: "div" }],
          },
        });
        assert.deepStrictEqual(config, {
          tag: "li",
          innerHTML: {
            items: ["hello", { tag: "div" }],
          },
        });
      });

      test("mixed single and array child syntax in the same innerHTML", () => {
        const config = createMockComponent({
          tag: "div",
          innerHTML: {
            single: { tag: "p", innerHTML: "text" },
            multiple: [{ tag: "div" }, { tag: "div" }],
          },
        });
        assert.deepStrictEqual(config, {
          tag: "div",
          innerHTML: {
            single: { tag: "p", innerHTML: "text" },
            multiple: [{ tag: "div" }, { tag: "div" }],
          },
        });
      });
    });

    describe("Render array children", () => {
      test("renders array children in correct order", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            items: [
              { tag: "span", innerHTML: "1" },
              { tag: "span", innerHTML: "2" },
            ],
          },
        });
        const { html } = renderBound(comp);
        assert.strictEqual(html, "<div><span>1</span><span>2</span></div>");
      });

      test("renders multiple div siblings correctly", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            items: [
              { tag: "div", innerHTML: "a" },
              { tag: "div", innerHTML: "b" },
            ],
          },
        });
        const { html } = renderBound(comp);
        assert.strictEqual(html, "<div><div>a</div><div>b</div></div>");
      });

      test("renders array of text nodes in order", () => {
        const comp = createComponent({
          tag: "h1",
          innerHTML: {
            texts: ["Hello ", "World"],
          },
        });
        const { html } = renderBound(comp);
        assert.strictEqual(html, "<h1>Hello World</h1>");
      });

      test("renders mixed text and components in array", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            items: ["text ", { tag: "span", innerHTML: "nested" }],
          },
        });
        const { html } = renderBound(comp);
        assert.strictEqual(html, "<div>text <span>nested</span></div>");
      });

      test("array children with CSS are scoped correctly", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            items: [
              { tag: "span", innerHTML: "a", css: { color: "inherit" } },
              { tag: "span", innerHTML: "b", css: { display: "block" } },
            ],
          },
        });
        const { html, css } = renderBound(comp);
        assert.ok(html.includes("<span"));
        assert.ok(css.includes("color: inherit;"));
        assert.ok(css.includes("display: block;"));
      });

      test("CSS > selector targets all array children with semantic attribute", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            items: [
              { tag: "span", innerHTML: "a" },
              { tag: "span", innerHTML: "b" },
            ],
          },
          css: {
            "> items": { color: "inherit" },
          },
        });
        const { html, css } = renderBound(comp);
        assert.ok(
          html.includes("data-cid-items"),
          "array children should carry semantic name",
        );
        assert.ok(
          css.includes("[data-cid-items]"),
          "CSS should target semantic name",
        );
        assert.ok(css.includes("color: inherit;"));
      });

      // Regression: the type-level settlement of an array child used to collapse
      // to `never` whenever entries' text differed, so `tsc` rejected a `> block`
      // prop the runtime accepted. This file is type-checked, so the accept case
      // below proves the walls agree at compile time; the runtime assertion
      // proves it at run time too.
      test("a > block on an array of same-tag children with differing text unlocks the tag's display props", () => {
        // The two shapes from the original report: ul > li with margin-top,
        // and div > div with width.
        assert.doesNotThrow(() => {
          createComponent({
            tag: "ul",
            innerHTML: {
              item: [
                { tag: "li", innerHTML: "a" },
                { tag: "li", innerHTML: "b" },
              ],
            },
            css: { "> item": { "margin-top": "2px" } },
          });
        });
        assert.doesNotThrow(() => {
          createComponent({
            tag: "div",
            innerHTML: {
              item: [
                { tag: "div", innerHTML: "a" },
                { tag: "div", innerHTML: "b" },
              ],
            },
            css: { "> item": { width: "2px" } },
          });
        });
      });

      test("a > block on an array with disagreeing tags stays locked on both walls", () => {
        // div is block, span is inline: no single implicit display applies, so
        // both walls report the locked prop (rather than a structural error).
        assert.throws(
          () => {
            createComponent({
              tag: "div",
              innerHTML: {
                item: [
                  { tag: "div", innerHTML: "a" },
                  { tag: "span", innerHTML: "b" },
                ],
              },
              css: {
                "> item": {
                  // @ts-expect-error no single display applies to the array
                  width: "2px",
                },
              },
            });
          },
          /'width' requires display:/,
        );
      });

      test("CSS nested > selectors through array child renders correctly", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            wrapper: [
              {
                tag: "div",
                innerHTML: {
                  inner: { tag: "span", innerHTML: "deep" },
                },
              },
            ],
          },
          css: {
            "> wrapper": {
              "> inner": { color: "inherit" },
            },
          },
        });
        const { html, css } = renderBound(comp);
        assert.ok(
          html.includes("data-cid-wrapper"),
          "array element should carry semantic name",
        );
        assert.ok(
          html.includes("data-cid-inner"),
          "nested child should carry semantic name",
        );
        assert.ok(
          css.includes("[data-cid-wrapper]"),
          "CSS should target outer semantic name",
        );
        assert.ok(
          css.includes("[data-cid-inner]"),
          "CSS should target inner semantic name",
        );
        assert.ok(css.includes("color: inherit;"));
      });

      test("CSS pseudo-class on parent targets array children with > selector", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            items: [
              { tag: "span", innerHTML: "a" },
              { tag: "span", innerHTML: "b" },
            ],
          },
          css: {
            ":hover": {
              "> items": { color: "inherit" },
            },
          },
        });
        const { html, css } = renderBound(comp);
        assert.ok(html.includes("data-cid-items"));
        assert.ok(css.includes(":hover"));
        assert.ok(css.includes("[data-cid-items]"));
        assert.ok(css.includes("color: inherit;"));
      });

      test("CSS > selector targets array child with pseudo-class block on the child", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            items: [
              { tag: "span", innerHTML: "a" },
              { tag: "span", innerHTML: "b" },
            ],
          },
          css: {
            "> items": {
              color: "inherit",
              ":hover": { color: "transparent" },
            },
          },
        });
        const { html, css } = renderBound(comp);
        assert.ok(html.includes("data-cid-items"));
        assert.ok(css.includes("[data-cid-items]"));
        assert.ok(css.includes("color: inherit;"));
        assert.ok(css.includes(":hover"));
        assert.ok(css.includes("color: transparent;"));
      });

      test("different innerHTML keys on each array element are independently CSS-targetable", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            items: [
              {
                tag: "div",
                innerHTML: { inner1: { tag: "span", innerHTML: "a" } },
              },
              {
                tag: "div",
                innerHTML: { inner2: { tag: "span", innerHTML: "b" } },
              },
            ],
          },
          css: {
            "> items": {
              "> inner1": { color: "inherit" },
              "> inner2": { display: "block" },
            },
          },
        });
        const { html, css } = renderBound(comp);
        assert.ok(
          html.includes("data-cid-items"),
          "array children carry semantic name",
        );
        assert.ok(
          html.includes("data-cid-inner1"),
          "first element's inner key is targeted",
        );
        assert.ok(
          html.includes("data-cid-inner2"),
          "second element's inner key is targeted",
        );
        assert.ok(
          css.includes("[data-cid-inner1]"),
          "CSS targets inner1 semantic name",
        );
        assert.ok(
          css.includes("[data-cid-inner2]"),
          "CSS targets inner2 semantic name",
        );
        assert.ok(css.includes("color: inherit;"));
        assert.ok(css.includes("display: block;"));
      });

      test("partial innerHTML overlap across array elements with deep CSS targeting", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            items: [
              {
                tag: "li",
                innerHTML: { inner1: { tag: "div", innerHTML: "only" } },
              },
              {
                tag: "li",
                innerHTML: {
                  inner1: {
                    tag: "div",
                    innerHTML: { inner3: { tag: "div", innerHTML: "deep" } },
                  },
                  inner2: { tag: "div", innerHTML: "solo" },
                },
              },
            ],
          },
          css: {
            display: "block",
            width: "100px",
            "> items": {
              "> inner2": { color: "inherit" },
              "> inner1": {
                "> inner3": { color: "transparent" },
              },
            },
          },
        });
        const { html, css } = renderBound(comp);
        // All semantic names present
        assert.ok(html.includes("data-cid-items"), "array elements carry data-cid-items");
        assert.ok(
          html.includes("data-cid-inner1"),
          "inner1 present on both array elements",
        );
        assert.ok(
          html.includes("data-cid-inner2"),
          "inner2 present on second element",
        );
        assert.ok(
          html.includes("data-cid-inner3"),
          "inner3 present inside second element's inner1",
        );
        // CSS targets each path
        assert.ok(css.includes("[data-cid-items]"), "CSS targets items");
        assert.ok(css.includes("[data-cid-inner2]"), "CSS targets inner2");
        assert.ok(css.includes("[data-cid-inner1]"), "CSS targets inner1");
        assert.ok(css.includes("[data-cid-inner3]"), "CSS targets inner3");
        assert.ok(css.includes("color: inherit;"));
        assert.ok(css.includes("color: transparent;"));
        assert.ok(css.includes("width: 100px;"));
      });

      test("deeply branched arrays: 2 inner1 × 2 inner2 → inner5-8 targetable via CSS", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            inner1: [
              {
                tag: "div",
                innerHTML: {
                  inner2: [
                    {
                      tag: "div",
                      innerHTML: { inner5: { tag: "span", innerHTML: "5" } },
                    },
                    {
                      tag: "div",
                      innerHTML: { inner6: { tag: "span", innerHTML: "6" } },
                    },
                  ],
                },
              },
              {
                tag: "div",
                innerHTML: {
                  inner2: [
                    {
                      tag: "div",
                      innerHTML: { inner7: { tag: "span", innerHTML: "7" } },
                    },
                    {
                      tag: "div",
                      innerHTML: { inner8: { tag: "div", innerHTML: "8" } },
                    },
                  ],
                },
              },
            ],
          },
          css: {
            "> inner1": {
              "> inner2": {
                "> inner5": { color: "inherit" },
                "> inner6": { color: "inherit" },
                "> inner7": { color: "inherit" },
                "> inner8": { color: "inherit" },
              },
            },
          },
        });
        const { html, css } = renderBound(comp);
        // All semantic names present
        assert.ok(
          html.includes("data-cid-inner1"),
          "array inner1 carries semantic name",
        );
        assert.ok(
          html.includes("data-cid-inner2"),
          "array inner2 carries semantic name",
        );
        assert.ok(html.includes("data-cid-inner5"), "inner5 present");
        assert.ok(html.includes("data-cid-inner6"), "inner6 present");
        assert.ok(html.includes("data-cid-inner7"), "inner7 present");
        assert.ok(html.includes("data-cid-inner8"), "inner8 present");
        // CSS targets each path
        assert.ok(css.includes("[data-cid-inner1]"));
        assert.ok(css.includes("[data-cid-inner2]"));
        assert.ok(css.includes("[data-cid-inner5]"));
        assert.ok(css.includes("[data-cid-inner6]"));
        assert.ok(css.includes("[data-cid-inner7]"));
        assert.ok(css.includes("[data-cid-inner8]"));
      });
    });

    describe("Nesting", () => {
      test("array with single element works like bare child", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            item: [{ tag: "span", innerHTML: "single" }],
          },
        });
        const { html } = renderBound(comp);
        assert.strictEqual(html, "<div><span>single</span></div>");
      });

      test("component in array can have its own array children", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            sections: [
              {
                tag: "div",
                innerHTML: {
                  items: [
                    { tag: "span", innerHTML: "nested1" },
                    { tag: "span", innerHTML: "nested2" },
                  ],
                },
              },
            ],
          },
        });
        const { html } = renderBound(comp);
        assert.strictEqual(
          html,
          "<div><div><span>nested1</span><span>nested2</span></div></div>",
        );
      });

      test("deeply nested arrays in complex hierarchy", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: {
            level1: {
              tag: "div",
              innerHTML: {
                level2: [
                  {
                    tag: "div",
                    innerHTML: {
                      level3: [{ tag: "span", innerHTML: "deep" }],
                    },
                  },
                ],
              },
            },
          },
        });
        const { html } = renderBound(comp);
        assert.strictEqual(
          html,
          "<div><div><div><span>deep</span></div></div></div>",
        );
      });
    });

    describe("Edge Cases", () => {
      test("empty array of children renders correctly", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: { items: [] },
        });
        const { html } = renderBound(comp);
        assert.strictEqual(html, "<div></div>");
      });

      test("array with one element renders correctly", () => {
        const comp = createComponent({
          tag: "div",
          innerHTML: { item: [{ tag: "span", innerHTML: "only" }] },
        });
        const { html } = renderBound(comp);
        assert.strictEqual(html, "<div><span>only</span></div>");
      });

      test("void element rejects innerHTML with array children", () => {
        assert.throws(
          () =>
            createMockComponent({
              tag: "img",
              // @ts-expect-error
              attributes: { src: "x.png", alt: "" },
              innerHTML: { items: [{ tag: "div" }] },
            }),
          /Validation Error: Tag '<img>' is configured as a void element/,
        );
      });
    });
  });
});
