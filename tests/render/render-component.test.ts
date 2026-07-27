import test, { describe } from "node:test";
import assert from "node:assert";
import { renderComponent } from "@/engine/render/render-component.ts";
import type { BaseHTMLTagConfig } from "@/html/tag-config/types.ts";
import type { BaseComponentStructure } from "@/engine/types.ts";

const tagConfig: BaseHTMLTagConfig = {
  a: {
    display: "inline",
    attributes: {},
    innerHTML: "*",
    cssPseudoClass: [":hover"],
    cssPseudoElement: [],
  },
  div: {
    display: "block",
    attributes: {},
    innerHTML: "*",
    cssPseudoElement: ["::before"],
    cssPseudoClass: [],
  },
  span: {
    display: "inline",
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
  img: {
    display: "inline",
    attributes: {},
    innerHTML: [],
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
};

function render(node: BaseComponentStructure) {
  return renderComponent(tagConfig, node);
}

/** The hash scope of an element that has a `css` block but no semantic name. */
function hashScope(html: string, tag: string): string {
  const match = html.match(new RegExp(`^<${tag} (cid-[a-z0-9]+)`));
  const token = match?.[1];
  assert.ok(token, `expected a hash scope on <${tag}> in: ${html}`);
  return token;
}

describe("renderComponent", () => {
  describe("HTML string output", () => {
    test("a plain element (no css, no name) gets no identifier attribute", () => {
      const { html } = render({ tag: "div" });
      assert.strictEqual(html, "<div></div>");
    });

    test("void elements do not emit a closing tag or children", () => {
      const { html } = render({
        tag: "img",
        attributes: { src: "x.png", alt: "x" },
      });
      assert.strictEqual(html, `<img src="x.png" alt="x">`);
    });

    test("non-void elements wrap their children", () => {
      const { html } = render({
        tag: "div",
        innerHTML: { title: { tag: "h1", innerHTML: "hello" } },
      });
      assert.strictEqual(html, `<div><h1>hello</h1></div>`);
    });
  });

  describe("Attribute rendering", () => {
    test("serializes string attributes", () => {
      const { html } = render({ tag: "a", attributes: { href: "/x" } });
      assert.strictEqual(html, `<a href="/x"></a>`);
    });

    test("boolean true renders bare, false is omitted", () => {
      const { html } = render({
        tag: "a",
        attributes: { download: true, hidden: false },
      });
      assert.ok(/ download(?![=])/.test(html));
      assert.ok(!html.includes("hidden"));
    });

    test("undefined attributes are omitted", () => {
      const { html } = render({
        tag: "a",
        attributes: { href: undefined, target: "_blank" },
      });
      assert.ok(!html.includes("href"));
      assert.ok(html.includes(' target="_blank"'));
    });

    test("identifier attributes precede user attributes", () => {
      const { html } = render({
        tag: "a",
        css: { width: "1px" },
        attributes: { href: "/x" },
      });
      assert.match(html, /^<a cid-[a-z0-9]+ href="\/x">/);
    });
  });

  describe("Semantic naming", () => {
    test("a child targeted by a direct child selector carries a semantic cid attribute", () => {
      const { html } = render({
        tag: "div",
        innerHTML: {
          someImage: { tag: "img", attributes: { src: "", alt: "" } },
          title: { tag: "h1", innerHTML: "t" },
        },
        css: { "> title": { color: "red" } },
      });
      // `title` is targeted, `someImage` is not.
      assert.ok(html.includes("<h1 cid-title>"));
      assert.ok(!html.includes("cid-someImage"));
      assert.ok(html.includes("<img "));
    });

    test("an untargeted child gets no semantic cid attribute", () => {
      const { html } = render({
        tag: "div",
        innerHTML: {
          title: { tag: "h1", innerHTML: "t" },
        },
      });
      assert.ok(!html.includes("cid-title"));
      assert.strictEqual(html, `<div><h1>t</h1></div>`);
    });

    test("a targeted child with its own css carries both semantic and hash", () => {
      const { html } = render({
        tag: "div",
        innerHTML: {
          inner: { tag: "span", innerHTML: "hi", css: { color: "green" } },
        },
        css: { "> inner": { display: "block" } },
      });
      assert.match(html, /<span cid-inner cid-[a-z0-9]+>hi<\/span>/);
    });

    test("an untargeted child with its own css carries only its hash", () => {
      const { html } = render({
        tag: "div",
        innerHTML: {
          inner: { tag: "span", innerHTML: "hi", css: { color: "green" } },
        },
      });
      assert.match(html, /<span cid-[a-z0-9]+>hi<\/span>/);
      assert.ok(!html.includes("cid-inner"));
    });

    test("child selectors nested via pseudo blocks still target the child", () => {
      const { html } = render({
        tag: "div",
        innerHTML: { inner: { tag: "span", innerHTML: "hi" } },
        css: { ":hover": { "> inner": { color: "green" } } },
      });
      assert.ok(html.includes("<span cid-inner>"));
    });
  });

  describe("Text & children rendering", () => {
    test("text nodes are rendered as-is", () => {
      const { html } = render({ tag: "h1", innerHTML: "just text" });
      assert.strictEqual(html, `<h1>just text</h1>`);
    });

    test("children render recursively in declaration order", () => {
      const { html } = render({
        tag: "div",
        innerHTML: {
          first: { tag: "span", innerHTML: "1" },
          second: { tag: "span", innerHTML: "2" },
        },
      });
      assert.strictEqual(html, `<div><span>1</span><span>2</span></div>`);
    });
  });

  describe("CSS string output", () => {
    test("empty component produces no css", () => {
      const { css } = render({ tag: "div" });
      assert.strictEqual(css, "");
    });

    test("explicitly empty css object elides output", () => {
      const { css } = render({ tag: "div", css: {} });
      assert.strictEqual(css, "");
    });

    test("empty css blocks are elided", () => {
      const { css } = render({ tag: "div", css: { ":visited": {} } });
      assert.strictEqual(css, "");
    });

    test("scopes declarations to the element's hash selector", () => {
      const { html, css } = render({ tag: "div", css: { width: "100%" } });
      const scope = hashScope(html, "div");
      assert.strictEqual(css, `[${scope}] {\n  width: 100%;\n}`);
    });

    test("custom properties are rendered as declarations", () => {
      const { html, css } = render({ tag: "div", css: { "--x": "1px" } });
      const scope = hashScope(html, "div");
      assert.strictEqual(css, `[${scope}] {\n  --x: 1px;\n}`);
    });

    test("pseudo-class blocks nest with &", () => {
      const { html, css } = render({
        tag: "a",
        css: { color: "red", ":hover": { color: "blue" } },
      });
      const scope = hashScope(html, "a");
      assert.strictEqual(
        css,
        [
          `[${scope}] {`,
          `  color: red;`,
          `  &:hover {`,
          `    color: blue;`,
          `  }`,
          `}`,
        ].join("\n"),
      );
    });

    test("pseudo-element blocks nest with &", () => {
      const { html, css } = render({
        tag: "div",
        css: { "::before": { content: "x" } },
      });
      const scope = hashScope(html, "div");
      assert.strictEqual(
        css,
        [`[${scope}] {`, `  &::before {`, `    content: x;`, `  }`, `}`].join(
          "\n",
        ),
      );
    });

    test("child selectors nest as `& > [cid-<name>]`", () => {
      const { html, css } = render({
        tag: "div",
        innerHTML: { inner: { tag: "span", innerHTML: "hi" } },
        css: { "> inner": { color: "green" } },
      });
      const scope = hashScope(html, "div");
      assert.strictEqual(
        css,
        [
          `[${scope}] {`,
          `  & > [cid-inner] {`,
          `    color: green;`,
          `  }`,
          `}`,
        ].join("\n"),
      );
    });

    test("nested child selectors chain deeper", () => {
      const { html, css } = render({
        tag: "div",
        innerHTML: {
          content: {
            tag: "div",
            innerHTML: { title: { tag: "h1", innerHTML: "hi" } },
          },
        },
        css: { "> content": { "> title": { color: "red" } } },
      });
      const scope = hashScope(html, "div");
      assert.strictEqual(
        css,
        [
          `[${scope}] {`,
          `  & > [cid-content] {`,
          `    & > [cid-title] {`,
          `      color: red;`,
          `    }`,
          `  }`,
          `}`,
        ].join("\n"),
      );
    });

    test("a child's own css is a separate hash-scoped block; parent targets its semantic name", () => {
      const { html, css } = render({
        tag: "div",
        innerHTML: {
          inner: { tag: "span", innerHTML: "hi", css: { color: "green" } },
        },
        css: { "> inner": { display: "block" } },
      });
      const rootScope = hashScope(html, "div");
      const innerHash = html.match(/<span cid-inner (cid-[a-z0-9]+)>/)?.[1];
      assert.ok(innerHash, "expected inner element to carry a hash scope");

      assert.strictEqual(
        css,
        [
          `[${rootScope}] {`,
          `  & > [cid-inner] {`,
          `    display: block;`,
          `  }`,
          `}`,
          ``,
          `[${innerHash}] {`,
          `  color: green;`,
          `}`,
        ].join("\n"),
      );
    });
  });

  describe("Scoping", () => {
    test("identical structures share a hash, distinct structures differ", () => {
      const a = render({ tag: "div", css: { width: "1px" } });
      const b = render({ tag: "div", css: { width: "1px" } });
      const c = render({ tag: "div", css: { width: "2px" } });
      assert.strictEqual(hashScope(a.html, "div"), hashScope(b.html, "div"));
      assert.notStrictEqual(hashScope(a.html, "div"), hashScope(c.html, "div"));
    });

    test("html hash matches the css selector", () => {
      const { html, css } = render({ tag: "div", css: { width: "1px" } });
      assert.ok(css.startsWith(`[${hashScope(html, "div")}]`));
    });

    test("instances with identical css but different data share one scope", () => {
      const card = (n: number): BaseComponentStructure => ({
        tag: "div",
        attributes: { class: n > 1 ? "active card" : "card" },
        innerHTML: { label: { tag: "span", innerHTML: String(n) } },
        css: { width: "1px" },
      });
      const one = render(card(1));
      const two = render(card(2));
      // Same css → same scope, even though class/text data differ.
      assert.strictEqual(
        hashScope(one.html, "div"),
        hashScope(two.html, "div"),
      );
    });

    test("a component styled once is emitted once across many instances", () => {
      const card = (n: number): BaseComponentStructure => ({
        tag: "div",
        attributes: { class: n > 1 ? "active card" : "card" },
        innerHTML: { label: { tag: "span", innerHTML: String(n) } },
        css: { width: "1px" },
      });
      const { css } = render({
        tag: "div",
        innerHTML: { items: [card(1), card(2), card(3)] },
      });
      // The shared rule appears exactly once, not once per instance.
      assert.strictEqual(css.split("width: 1px;").length - 1, 1);
    });
  });

  describe("Determinism & edge cases", () => {
    test("renders deeply nested components", () => {
      const { html } = render({
        tag: "div",
        innerHTML: {
          a: {
            tag: "div",
            innerHTML: { b: { tag: "span", innerHTML: "deep" } },
          },
        },
      });
      assert.strictEqual(html, `<div><div><span>deep</span></div></div>`);
    });

    test("class selectors render as &,className", () => {
      const { html, css } = render({
        tag: "div",
        css: { "&.active": { color: "red" } },
      });
      const scope = hashScope(html, "div");
      assert.strictEqual(
        css,
        [`[${scope}] {`, `  &.active {`, `    color: red;`, `  }`, `}`].join(
          "\n",
        ),
      );
    });

    test("class selectors nest inside pseudo-class blocks", () => {
      const { html, css } = render({
        tag: "a",
        css: {
          ":hover": {
            "&.active": { color: "blue" },
          },
        },
      });
      const scope = hashScope(html, "a");
      assert.strictEqual(
        css,
        [
          `[${scope}] {`,
          `  &:hover {`,
          `    &.active {`,
          `      color: blue;`,
          `    }`,
          `  }`,
          `}`,
        ].join("\n"),
      );
    });

    test("class selectors render alongside pseudo-class and declarations", () => {
      const { html, css } = render({
        tag: "div",
        css: {
          color: "black",
          "&.active": { color: "red" },
          ":hover": { color: "blue" },
        },
      });
      const scope = hashScope(html, "div");
      assert.strictEqual(
        css,
        [
          `[${scope}] {`,
          `  color: black;`,
          `  &.active {`,
          `    color: red;`,
          `  }`,
          `  &:hover {`,
          `    color: blue;`,
          `  }`,
          `}`,
        ].join("\n"),
      );
    });

    test("class attribute is rendered as space-separated string in HTML output", () => {
      const { html } = render({
        tag: "div",
        attributes: { class: "foo bar" },
      });
      assert.ok(html.includes('class="foo bar"'));
    });

    test("class selectors inside child selector blocks", () => {
      const { html, css } = render({
        tag: "div",
        innerHTML: { inner: { tag: "span", innerHTML: "hi" } },
        css: {
          "> inner": {
            "&.highlight": { color: "yellow" },
          },
        },
      });
      const scope = hashScope(html, "div");
      assert.strictEqual(
        css,
        [
          `[${scope}] {`,
          `  & > [cid-inner] {`,
          `    &.highlight {`,
          `      color: yellow;`,
          `    }`,
          `  }`,
          `}`,
        ].join("\n"),
      );
    });

    test("produces identical output across repeated calls", () => {
      const node: BaseComponentStructure = {
        tag: "div",
        innerHTML: { t: { tag: "h1", innerHTML: "x" } },
        css: { width: "10px", ":hover": { width: "20px" } } as Record<
          string,
          unknown
        >,
      };
      assert.deepStrictEqual(render(node), render(node));
    });
  });
});
