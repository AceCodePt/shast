import test, { describe } from "node:test";
import assert from "node:assert";
import {
  SUPPORTED_KEYWORDS,
  type DSLInfer,
  type SupportedKeywords,
} from "tsyntax";
import engine from "@/engine/index.ts";
import { cssPropertiesConfig } from "@/css/properties-config/index.ts";
import {
  CSS_WIDE_KEYWORDS,
  type CSSWideKeyword,
} from "@/css/wide-keyword.ts";
import HTML_GLOBAL_ATTRIBUTES_CONFIG from "@/html/attribute-config/variations/common.ts";
import HTML_TAGS_CONFIG from "@/html/tag-config/variations/common.ts";
import CSS_SYNTAX_CONFIG from "@/css/syntax-config/variations/common.ts";
import CSS_ATTRIBUTES_CONFIG from "@/css/attribute-config/variations/common.ts";
import CSS_GLOBAL_PSEUDO_CLASSES_CONFIG from "@/css/pseudo-class-config/variations/common.ts";
import { assertType, type Equal } from "../type-utils.ts";

const CSS_GLOBAL_PROPERTIES = cssPropertiesConfig(
  SUPPORTED_KEYWORDS,
  CSS_SYNTAX_CONFIG,
  {
    "--_a": {
      syntax: "<percentage>",
      inherits: false,
      "initial-value": "1%",
    },
    "--background-color": {
      syntax: "<color>",
      inherits: false,
      "initial-value": "hsl(1 1% 1%)",
    },
  },
);

const engineConfig = {
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig: HTML_GLOBAL_ATTRIBUTES_CONFIG,
  htmlTagConfig: HTML_TAGS_CONFIG,
  cssSyntaxConfig: CSS_SYNTAX_CONFIG,
  cssAttributesConfig: CSS_ATTRIBUTES_CONFIG,
  cssPseudoClassConfig: CSS_GLOBAL_PSEUDO_CLASSES_CONFIG,
  cssPropertiesConfig: CSS_GLOBAL_PROPERTIES,
  cssQueriesConfig: [] as const,
};

const { createComponent } = engine(engineConfig);

// Same type wall, runtime checks skipped: lets a type-only rejection be
// asserted without the runtime backstop throwing first.
const { createComponent: createTypeOnlyComponent } = engine(engineConfig, {
  skipValidation: true,
});

// Each keyword is typed as the `CSSWideKeyword` union, so the loop exercises
// the *type* wall (the value must be assignable to the property's inferred
// value) and the runtime wall on every iteration.
const KEYWORDS: readonly CSSWideKeyword[] = CSS_WIDE_KEYWORDS;

describe("CSS-wide keywords", () => {
  describe("Runtime validation", () => {
    test("accepts all five keywords on flat property DSLs", () => {
      for (const keyword of KEYWORDS) {
        assert.doesNotThrow(() =>
          createComponent({
            tag: "div",
            innerHTML: "hi",
            css: {
              color: keyword,
              "background-color": keyword,
              margin: keyword,
              padding: keyword,
              border: keyword,
              "font-family": keyword,
            },
          }),
        );
      }
    });

    test("accepts all five keywords on gate properties", () => {
      for (const keyword of KEYWORDS) {
        assert.doesNotThrow(() =>
          createComponent({
            tag: "div",
            innerHTML: "hi",
            css: { display: keyword, opacity: keyword, position: keyword },
          }),
        );
      }
    });

    test("accepts all five keywords on gate-unlocked self properties", () => {
      for (const keyword of KEYWORDS) {
        assert.doesNotThrow(() =>
          createComponent({
            tag: "div",
            innerHTML: "hi",
            // `width` is unlocked by <div>'s implicit display: block.
            css: { width: keyword, height: keyword },
          }),
        );
      }
    });

    test("accepts all five keywords on gate-unlocked child properties", () => {
      for (const keyword of KEYWORDS) {
        assert.doesNotThrow(() =>
          createComponent({
            tag: "div",
            innerHTML: { item: { tag: "span", innerHTML: "x" } },
            css: {
              display: "flex",
              // align-self is unlocked on children under display: flex.
              "> item": { "align-self": keyword },
            },
          }),
        );
      }
    });

    test("accepts all five keywords on registered custom properties", () => {
      for (const keyword of KEYWORDS) {
        assert.doesNotThrow(() =>
          createComponent({
            tag: "div",
            innerHTML: "hi",
            css: { "--_a": keyword, "--background-color": keyword },
          }),
        );
      }
    });

    test("an invalid property value still fails", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "hi",
            css: {
              // @ts-expect-error - 'greenish' is not a <color>
              color: "greenish",
            },
          }),
        /does not match DSL/,
      );
    });

    test("an invalid gate value still fails", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "hi",
            css: {
              // @ts-expect-error - 'floppy' is not a display value
              display: "floppy",
            },
          }),
        /CSS Error: Invalid value 'floppy' for 'display'/,
      );
    });

    test("an invalid gate-unlocked value still fails", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "hi",
            css: {
              // @ts-expect-error - 'wide' is not a <length-percentage>
              width: "wide",
            },
          }),
        /does not match DSL/,
      );
    });

    test("keywords do not mask a bad value that merely resembles one", () => {
      assert.throws(
        () =>
          createComponent({
            tag: "div",
            innerHTML: "hi",
            css: {
              // @ts-expect-error - 'inherited' is not a keyword
              width: "inherited",
            },
          }),
        /does not match DSL/,
      );
    });
  });

  describe("Type validation", () => {
    // The keyword union is accepted where a property's own DSL would reject
    // the individual keywords: `revert`, `unset`, `initial` and `revert-layer`
    // are not part of the common `<color>` syntax.
    type ColorInfer = DSLInfer<
      SupportedKeywords & typeof CSS_SYNTAX_CONFIG,
      "<color>"
    >;

    test("the property's own DSL does not contain the other keywords", () => {
      assertType<Equal<Extract<ColorInfer, CSSWideKeyword>, "inherit">>();
    });

    test("the type wall accepts the keyword union on a property whose DSL rejects it", () => {
      const keyword: CSSWideKeyword = "revert-layer";
      assert.doesNotThrow(() =>
        createComponent({
          tag: "div",
          innerHTML: "hi",
          css: { color: keyword, width: keyword, "--_a": keyword },
        }),
      );
    });

    test("invalid values are still rejected at the type wall", () => {
      createTypeOnlyComponent({
        tag: "div",
        innerHTML: "hi",
        css: {
          // @ts-expect-error - 'greenish' is not a <color>
          color: "greenish",
        },
      });
      createTypeOnlyComponent({
        tag: "div",
        innerHTML: "hi",
        css: {
          // @ts-expect-error - 'floppy' is not a display value
          display: "floppy",
        },
      });
      createTypeOnlyComponent({
        tag: "div",
        innerHTML: "hi",
        css: {
          // @ts-expect-error - 'wide' is not a <length-percentage>
          width: "wide",
        },
      });
    });
  });
});
