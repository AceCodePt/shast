import test, { describe } from "node:test";
import assert from "node:assert";
import engine from "@/engine/index.ts";
import { cssKeyframesConfig } from "@/css/keyframes-config/index.ts";
import type { KeyframeName } from "@/css/keyframes-config/types.ts";
import { cssPropertiesConfig } from "@/css/properties-config/index.ts";
import { htmlAttributeConfig } from "@/html/attribute-config/index.ts";
import { htmlTagConfig } from "@/html/tag-config/index.ts";
import COMMON_SYNTAX from "@/css/syntax-config/variations/common.ts";
import COMMON_ATTRIBUTES from "@/css/attribute-config/variations/common.ts";
import { SUPPORTED_KEYWORDS } from "tsyntax";
import { assertType, type Equal } from "../type-utils.ts";

// ---------------------------------------------------------------------------
// A registry that registers exactly two keyframes. `animation-name` and
// `animation` may only reference `fade` or `pulse` (plus `none` and the
// CSS-wide keywords); everything else is rejected by both walls.
// ---------------------------------------------------------------------------

const KEYFRAMES = cssKeyframesConfig(COMMON_SYNTAX, COMMON_ATTRIBUTES, {
  fade: { from: { opacity: "0" }, to: { opacity: "1" } },
  pulse: {
    "0%": { opacity: "0.5" },
    "50%": { opacity: "0.25" },
    "100%": { opacity: "1" },
  },
});

const TAG_CONFIG = htmlTagConfig(SUPPORTED_KEYWORDS, COMMON_ATTRIBUTES, {
  box: {
    display: "block",
    attributes: {},
    innerHTML: "*",
    cssPseudoClass: [":hover"],
    cssPseudoElement: ["::before"],
  },
  label: {
    display: "inline",
    attributes: {},
    innerHTML: ["#text"],
    cssPseudoClass: [],
    cssPseudoElement: [],
  },
});

const CSS_PROPERTIES = cssPropertiesConfig(SUPPORTED_KEYWORDS, COMMON_SYNTAX, {});

const { createComponent, renderComponent } = engine({
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig: htmlAttributeConfig(SUPPORTED_KEYWORDS, {
    id: "string | undefined",
    class: "string | undefined",
  }),
  htmlTagConfig: TAG_CONFIG,
  cssSyntaxConfig: COMMON_SYNTAX,
  cssAttributesConfig: COMMON_ATTRIBUTES,
  cssPseudoClassConfig: [":hover"],
  cssPropertiesConfig: CSS_PROPERTIES,
  cssQueriesConfig: [],
  cssKeyframesConfig: KEYFRAMES,
});

function hashScope(html: string, tag: string): string {
  const match = html.match(new RegExp(`^<${tag} (cid-[a-z0-9]+)`));
  const token = match?.[1];
  assert.ok(token, `expected a hash scope on <${tag}> in: ${html}`);
  return token;
}

describe("css keyframes integration", () => {
  describe("Type Validation", () => {
    test("animation-name referencing a registered keyframe typechecks", () => {
      createComponent({
        tag: "box",
        innerHTML: "x",
        css: { "animation-name": "fade" },
      });
    });

    test("animation-name may be none or a CSS-wide keyword", () => {
      createComponent({
        tag: "box",
        innerHTML: "x",
        css: { "animation-name": "none" },
      });
      createComponent({
        tag: "box",
        innerHTML: "x",
        css: { "animation-name": "inherit" },
      });
    });

    test("the animation shorthand referencing a registered keyframe typechecks", () => {
      createComponent({
        tag: "box",
        innerHTML: "x",
        css: { animation: "fade 1s linear infinite" },
      });
    });

    test("the shorthand name may appear anywhere in the value", () => {
      createComponent({
        tag: "box",
        innerHTML: "x",
        css: { animation: "1s linear pulse" },
      });
    });

    test("a CSS-wide keyword is legal as the shorthand", () => {
      createComponent({
        tag: "box",
        innerHTML: "x",
        css: { animation: "inherit" },
      });
    });

    test("an unknown animation-name is a type-level error", () => {
      assert.throws(() =>
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            // @ts-expect-error 'fadeout' is not a registered keyframe
            "animation-name": "fadeout",
          },
        }),
      );
    });

    test("an unknown name in the shorthand is a type-level error", () => {
      assert.throws(() =>
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: {
            // @ts-expect-error 'fadeout' is not a registered keyframe
            animation: "fadeout 1s",
          },
        }),
      );
    });

    test("an unknown name nested inside a child/pseudo block is a type-level error", () => {
      assert.throws(() =>
        createComponent({
          tag: "box",
          innerHTML: { label: { tag: "label", innerHTML: "hi" } },
          css: {
            ":hover": {
              // @ts-expect-error 'fadeout' is not a registered keyframe
              "animation-name": "fadeout",
            },
          },
        }),
      );
    });
  });

  describe("Type Inference", () => {
    test("the registered names are the exact literal union", () => {
      assertType<Equal<keyof typeof KEYFRAMES, "fade" | "pulse">>();
      assertType<Equal<KeyframeName<typeof KEYFRAMES>, "fade" | "pulse">>();
    });

    test("createComponent infers the animation declarations", () => {
      const comp = createComponent({
        tag: "box",
        innerHTML: "x",
        css: { "animation-name": "pulse", animation: "fade 1s" },
      });
      assertType<Equal<typeof comp.css["animation-name"], "pulse">>();
      assertType<Equal<typeof comp.css["animation"], "fade 1s">>();
    });
  });

  describe("Runtime Validation", () => {
    test("a registered animation-name and shorthand validate", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: { "animation-name": "fade", animation: "pulse 2s ease" },
        }),
      );
    });

    test("a shorthand with the name not first validates", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: { animation: "1s linear pulse" },
        }),
      );
    });

    test("none and CSS-wide keywords validate", () => {
      assert.doesNotThrow(() =>
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: { "animation-name": "none", animation: "inherit" },
        }),
      );
    });

    test("an unknown animation-name is rejected at runtime", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              // @ts-expect-error 'fadeout' is not a registered keyframe
              "animation-name": "fadeout",
            },
          }),
        /does not reference a registered keyframe/,
      );
    });

    test("an unknown name in the shorthand is rejected at runtime", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              // @ts-expect-error 'fadeout' is not a registered keyframe
              animation: "fadeout 1s",
            },
          }),
        /does not reference a registered keyframe/,
      );
    });

    test("an unknown name nested in a pseudo block is rejected at runtime", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "box",
            innerHTML: "x",
            css: {
              ":hover": {
                // @ts-expect-error 'fadeout' is not a registered keyframe
                "animation-name": "fadeout",
              },
            },
          }),
        /does not reference a registered keyframe/,
      );
    });
  });

  describe("Rendering", () => {
    test("the referenced @keyframes rule is emitted exactly once", () => {
      const { html, css } = renderComponent(
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: { animation: "fade 1s linear" },
        }),
      );
      const scope = hashScope(html, "box");
      assert.ok(css.startsWith(`[${scope}] {`));
      assert.ok(css.includes("animation: fade 1s linear;"));
      assert.strictEqual(css.split("@keyframes fade").length - 1, 1);
      assert.ok(css.includes("@keyframes fade {"));
      assert.ok(css.includes("opacity: 0;"));
      assert.ok(css.includes("opacity: 1;"));
    });

    test("animation-name references its keyframe too", () => {
      const { css } = renderComponent(
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: { "animation-name": "pulse" },
        }),
      );
      assert.strictEqual(css.split("@keyframes pulse").length - 1, 1);
    });

    test("each referenced keyframe is emitted once, in reference order", () => {
      const { css } = renderComponent(
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: { animation: "fade 1s, pulse 2s" },
        }),
      );
      assert.strictEqual(css.split("@keyframes ").length - 1, 2);
      const fadeAt = css.indexOf("@keyframes fade");
      const pulseAt = css.indexOf("@keyframes pulse");
      assert.ok(fadeAt !== -1 && pulseAt !== -1 && fadeAt < pulseAt);
    });

    test("instances sharing the same keyframes emit them once", () => {
      const { css } = renderComponent(
        createComponent({
          tag: "box",
          innerHTML: {
            a: { tag: "box", innerHTML: "x", css: { animation: "fade 1s" } },
            b: { tag: "box", innerHTML: "x", css: { animation: "fade 1s" } },
            c: { tag: "box", innerHTML: "x", css: { animation: "fade 1s" } },
          },
        }),
      );
      assert.strictEqual(css.split("@keyframes fade").length - 1, 1);
    });

    test("two different keyframes referenced in one tree both emit once", () => {
      const { css } = renderComponent(
        createComponent({
          tag: "box",
          innerHTML: {
            a: { tag: "box", innerHTML: "x", css: { animation: "fade 1s" } },
            b: { tag: "box", innerHTML: "x", css: { animation: "pulse 2s" } },
          },
        }),
      );
      assert.strictEqual(css.split("@keyframes fade").length - 1, 1);
      assert.strictEqual(css.split("@keyframes pulse").length - 1, 1);
    });

    test("a reference nested in a pseudo block is collected", () => {
      const { css } = renderComponent(
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: { ":hover": { animation: "fade 1s" } },
        }),
      );
      assert.strictEqual(css.split("@keyframes fade").length - 1, 1);
    });

    test("a component referencing no keyframe emits no @keyframes", () => {
      const { css } = renderComponent(
        createComponent({
          tag: "box",
          innerHTML: "x",
          css: { width: "1px" },
        }),
      );
      assert.ok(!css.includes("@keyframes"));
    });
  });
});
