import test, { describe } from "node:test";
import assert from "node:assert";
import engine from "@/engine/index.ts";
import { SUPPORTED_KEYWORDS } from "tsyntax";
import { cssPropertiesConfig } from "@/css/properties-config/index.ts";
import commonCSSSyntax from "@/css/syntax-config/variations/common.ts";
import commonCSSAttributes from "@/css/attribute-config/variations/common.ts";
import commonCSSPseudoClasses from "@/css/pseudo-class-config/variations/common.ts";
import commonCSSQueries from "@/css/queries-config/variations/common.ts";
import commonCSSKeyframes from "@/css/keyframes-config/variations/common.ts";
import commonHTMLAttributes from "@/html/attribute-config/variations/common.ts";
import commonHTMLTags from "@/html/tag-config/variations/common.ts";

// ---------------------------------------------------------------------------
// The `CalcConstraint` / `VarConstraint` inversion maps over `keyof CSSValue`
// (the written keys) and keeps only registry-eligible, token-shaped ones in the
// `as` clause. These probes pin the two guarantees that inversion must not
// trade away: the deep calc/var walls still reject bad values, and the
// registry-membership test in the `as` clause still rejects a written key that
// is not in `CalcValueKeys` -- even when its value is calc-shaped, which is the
// case the filter exists for.
//
// Every negative probe carries an `@ts-expect-error`. If a wall softens the
// directive goes unused and `pnpm check` reports TS2578.
// ---------------------------------------------------------------------------

const cssProperties = cssPropertiesConfig(SUPPORTED_KEYWORDS, commonCSSSyntax, {
  "--spacing": { syntax: "<length>", inherits: false, "initial-value": "1rem" },
});

const { createComponent } = engine({
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig: commonHTMLAttributes,
  htmlTagConfig: commonHTMLTags,
  cssSyntaxConfig: commonCSSSyntax,
  cssAttributesConfig: commonCSSAttributes,
  cssPseudoClassConfig: commonCSSPseudoClasses,
  cssPropertiesConfig: cssProperties,
  cssQueriesConfig: commonCSSQueries,
  cssKeyframesConfig: commonCSSKeyframes,
});

describe("CalcConstraint / VarConstraint inversion", () => {
  test("positive controls still type-check", () => {
    assert.doesNotThrow(() =>
      createComponent({
        tag: "div",
        innerHTML: "x",
        css: { width: "calc(100% - 40px)" },
      }),
    );
    assert.doesNotThrow(() =>
      createComponent({
        tag: "div",
        innerHTML: "x",
        css: { width: "var(--spacing)" },
      }),
    );
  });

  test("a misspelled property is rejected at top level, in :hover and in @media", () => {
    // The value is calc-shaped on purpose: without the `CalcValueKeys`
    // membership test in the `as` clause the key would be declared and accepted,
    // so the excess-property error is what proves the filter is live. It shows
    // up as TS2561 (the suggestion form of the excess-property rule).
    assert.throws(() =>
      createComponent({
        tag: "div",
        innerHTML: "x",
        css: {
          // @ts-expect-error misspelled property with a calc-shaped value
          widht: "calc(1px)",
        },
      }),
    );
    assert.throws(() =>
      createComponent({
        tag: "div",
        innerHTML: "x",
        css: {
          ":hover": {
            // @ts-expect-error misspelled property with a calc-shaped value
            widht: "calc(1px)",
          },
        },
      }),
    );
    assert.throws(() =>
      createComponent({
        tag: "div",
        innerHTML: "x",
        css: {
          "@media (width < 768px)": {
            // @ts-expect-error misspelled property with a calc-shaped value
            widht: "calc(1px)",
          },
        },
      }),
    );
  });

  test("a bad calc unit is rejected flat and in :hover", () => {
    assert.throws(() =>
      createComponent({
        tag: "div",
        innerHTML: "x",
        css: {
          // @ts-expect-error mixed-dimension addition
          width: "calc(4px + 2deg)",
        },
      }),
    );
    assert.throws(() =>
      createComponent({
        tag: "div",
        innerHTML: "x",
        css: {
          ":hover": {
            // @ts-expect-error mixed-dimension addition
            width: "calc(4px + 2deg)",
          },
        },
      }),
    );
  });

  test("an unregistered var() is rejected flat and in :hover", () => {
    assert.throws(() =>
      createComponent({
        tag: "div",
        innerHTML: "x",
        css: {
          // @ts-expect-error unknown custom property
          width: "var(--nope)",
        },
      }),
    );
    assert.throws(() =>
      createComponent({
        tag: "div",
        innerHTML: "x",
        css: {
          ":hover": {
            // @ts-expect-error unknown custom property
            width: "var(--nope)",
          },
        },
      }),
    );
  });

  test("a bad enum value is rejected flat and in :hover", () => {
    assert.throws(() =>
      createComponent({
        tag: "div",
        innerHTML: "x",
        css: {
          // @ts-expect-error `flexx` is not a display value
          display: "flexx",
        },
      }),
    );
    assert.throws(() =>
      createComponent({
        tag: "div",
        innerHTML: "x",
        css: {
          ":hover": {
            // @ts-expect-error `flexx` is not a display value
            display: "flexx",
          },
        },
      }),
    );
  });
});
