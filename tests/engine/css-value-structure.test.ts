import test, { describe } from "node:test";
import assert from "node:assert";
import { createComponent, renderBound } from "./harness.ts";

// The reported injection: a string-typed CSS value that closes the declaration
// and opens rules of its own. Every string arm of the registry (`<string>`,
// `<custom-ident>`) accepts it at the DSL level, so the runtime wall must
// reject it structurally before the renderer prints it verbatim.
const BREAKOUT = "none; } body { display: none; } [x] { color: hsl(1 1% 1%)";

describe("runtime structural guard for string CSS values", () => {
  describe("rejects the reported break-out vector", () => {
    test("box-shadow (top-level attribute DSL)", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "x",
            css: { "box-shadow": BREAKOUT },
          }),
        /CSS Error: 'box-shadow' value contains a top-level ';'/,
      );
    });

    test("flex (gate-slot DSL, under display: flex)", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: { c: { tag: "div", innerHTML: "x" } },
            css: { display: "flex", "> c": { flex: BREAKOUT } },
          }),
        /CSS Error: 'flex' value contains a top-level ';'/,
      );
    });

    test("grid-template-areas (gate-slot DSL, under display: grid)", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "x",
            css: { display: "grid", "grid-template-areas": BREAKOUT },
          }),
        /CSS Error: 'grid-template-areas' value contains a top-level ';'/,
      );
    });

    test("place-content (gate-slot DSL, under display: grid)", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "x",
            css: { display: "grid", "place-content": BREAKOUT },
          }),
        /CSS Error: 'place-content' value contains a top-level ';'/,
      );
    });

    test("content (union arm)", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "x",
            css: { content: BREAKOUT },
          }),
        /CSS Error: 'content' value contains a top-level ';'/,
      );
    });
  });

  describe("rejects each structural delimiter at the top level", () => {
    test("a semicolon", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "x",
            css: { "box-shadow": "none; color: red" },
          }),
        /CSS Error: 'box-shadow' value contains a top-level ';'/,
      );
    });

    test("an opening brace", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "x",
            css: { "box-shadow": "none { color: red" },
          }),
        /CSS Error: 'box-shadow' value contains a top-level '\{'/,
      );
    });

    test("a closing brace", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "x",
            css: { "box-shadow": "none } body" },
          }),
        /CSS Error: 'box-shadow' value contains a top-level '\}'/,
      );
    });

    test("a comment opener outside a function", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "x",
            css: { "box-shadow": "none /* hide the rest" },
          }),
        /CSS Error: 'box-shadow' value contains '\/\*'/,
      );
    });

    test("a comment opener inside parentheses", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "x",
            css: { "background": "url(a/b) /* c" },
          }),
        /CSS Error: 'background' value contains '\/\*'/,
      );
    });

    test("a newline that ends a quoted string early", () => {
      // A CSS string cannot span a raw newline, so the `}` on the next line is
      // at the top level even though the value opened a quote before it.
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "x",
            css: { "box-shadow": 'none "\n} body { display: none } [x] { color: red' },
          }),
        /CSS Error: 'box-shadow' value contains a top-level '\}'/,
      );
    });

    test("a parenthesis inside an unquoted url() does not nest", () => {
      // `url(` is a single CSS token: its unquoted body ends at the first `)`,
      // so the `;` after it is at the top level.
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "x",
            css: { background: "url(a(b); } body { display: none } [x] { color: red" },
          }),
        /CSS Error: 'background' value contains a top-level ';'/,
      );
    });

    test("a quote inside an unquoted url() is not a string opener", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "x",
            css: { background: 'url(a"b); } body { display: none } [x] { color: red' },
          }),
        /CSS Error: 'background' value contains a top-level ';'/,
      );
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "x",
            css: { background: "url(a'b); } body { display: none } [x] { color: red" },
          }),
        /CSS Error: 'background' value contains a top-level ';'/,
      );
    });
  });

  describe("accepts legitimate values", () => {
    test("a plain box-shadow", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: { "box-shadow": "0 1px 2px red" },
        }),
      );
    });

    test("an unquoted multi-line grid-template-areas", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: { display: "grid", "grid-template-areas": "a a\nb b" },
        }),
      );
    });

    test("a quoted multi-line grid-template-areas", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: { display: "grid", "grid-template-areas": '"a a" "b b"' },
        }),
      );
    });

    test("a content value whose quoted text contains a brace", () => {
      const component = createComponent({
        tag: "div",
        innerHTML: "x",
        css: { content: '"a } b"' },
      });
      assert.match(renderBound(component).css, /content: "a \} b";/);
    });

    test("a data-URL background with a semicolon inside url()", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            background: "url(data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=)",
          },
        }),
      );
    });

    test("a quoted data-URL background", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            background: 'url("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")',
          },
        }),
      );
    });

    test("a backslash-escaped closing quote inside a quoted string", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: { content: '"a\\"; } b"' },
        }),
      );
    });
  });

  // A value that opens a string, a url token or a parenthesised block and
  // never closes it used to leave the scanner in a state where the structural
  // check was unreachable for the rest of the value, so everything after the
  // opener shipped unexamined. The scanner must end at the top level, and a
  // brace inside a function body is rejected in-loop (balanced parens do not
  // make it safe).
  describe("rejects an opener that never returns to the top level", () => {
    const UNCLOSED_STRING =
      /CSS Error: 'box-shadow' value has an unterminated string which never returns to the top level/;
    const UNCLOSED_FUNCTION =
      /CSS Error: 'box-shadow' value contains a '\}' inside a function/;

    test("a bare double-quoted string", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "x",
            css: { "box-shadow": '"; } .evil { color: red }' },
          }),
        UNCLOSED_STRING,
      );
    });

    test("a bare single-quoted string", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "x",
            css: { "box-shadow": "'; } .evil { color: red }" },
          }),
        UNCLOSED_STRING,
      );
    });

    test("an unclosed parenthesis", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "x",
            css: { "box-shadow": "(; } .evil { color: red }" },
          }),
        UNCLOSED_FUNCTION,
      );
    });

    test("a rebalanced parenthesis (ends at depth 0)", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "x",
            css: { "box-shadow": "(; } .evil { color: red })" },
          }),
        UNCLOSED_FUNCTION,
      );
    });

    test("an unclosed quoted url(), double-quoted", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "x",
            css: { "box-shadow": 'url(")"; } .evil { color: red }' },
          }),
        UNCLOSED_FUNCTION,
      );
    });

    test("an unclosed quoted url(), single-quoted", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "x",
            css: { "box-shadow": "url(')'; } .evil { color: red }" },
          }),
        UNCLOSED_FUNCTION,
      );
    });

    test("an unquoted data: URL carrying a semicolon", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            background: "url(data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=)",
          },
        }),
      );
    });

    test("a raw url() with an escaped parenthesis", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: { background: "url(a\\)b)" },
        }),
      );
    });

    test("a calc() expression", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: { width: "calc(100% - 2px)" },
        }),
      );
    });

    test("a quoted string containing a brace", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: { content: '"a } b"' },
        }),
      );
    });

    test("a quoted url() containing a semicolon", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: {
            background: 'url("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")',
          },
        }),
      );
    });

    test("content set to a lone quoted brace", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: "x",
          css: { content: '"}"' },
        }),
      );
    });
  });
});
