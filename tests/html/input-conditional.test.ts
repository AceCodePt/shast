import test, { describe } from "node:test";
import assert from "node:assert";
import { SUPPORTED_KEYWORDS } from "tsyntax";
import engine from "@/engine/index.ts";
import { cssPropertiesConfig } from "@/css/properties-config/index.ts";
import HTML_GLOBAL_ATTRIBUTES_CONFIG from "@/html/attribute-config/variations/common.ts";
import HTML_TAGS_CONFIG from "@/html/tag-config/variations/common.ts";
import CSS_SYNTAX_CONFIG from "@/css/syntax-config/variations/common.ts";
import CSS_ATTRIBUTES_CONFIG from "@/css/attribute-config/variations/common.ts";
import CSS_PSEUDO_CLASSES from "@/css/pseudo-class-config/variations/common.ts";
import COMMON_QUERIES from "@/css/queries-config/variations/common.ts";

// The shipped `common` registry now expresses the input vocabulary as a gate:
// `type` unlocks the attributes that are only meaningful for that type. This
// exercises the real variation, not a test-only registry.
const { createComponent, renderComponent } = engine({
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig: HTML_GLOBAL_ATTRIBUTES_CONFIG,
  htmlTagConfig: HTML_TAGS_CONFIG,
  cssSyntaxConfig: CSS_SYNTAX_CONFIG,
  cssAttributesConfig: CSS_ATTRIBUTES_CONFIG,
  cssPseudoClassConfig: CSS_PSEUDO_CLASSES,
  cssPropertiesConfig: cssPropertiesConfig(
    SUPPORTED_KEYWORDS,
    CSS_SYNTAX_CONFIG,
    {},
  ),
  cssQueriesConfig: COMMON_QUERIES,
});

describe("input type gates (shipped common registry)", () => {
  test("checkbox unlocks checked", () => {
    assert.doesNotThrow(() =>
      createComponent({
        tag: "input",
        attributes: { type: "checkbox", checked: true },
      }),
    );
  });

  test("radio unlocks checked", () => {
    assert.doesNotThrow(() =>
      createComponent({
        tag: "input",
        attributes: { type: "radio", checked: true },
      }),
    );
  });

  test("number unlocks min/max/step", () => {
    assert.doesNotThrow(() =>
      createComponent({
        tag: "input",
        attributes: { type: "number", min: 0, max: 10, step: 1 },
      }),
    );
  });

  test("text unlocks maxlength/minlength/pattern", () => {
    assert.doesNotThrow(() =>
      createComponent({
        tag: "input",
        attributes: { type: "text", maxlength: 3, minlength: 1, pattern: "x" },
      }),
    );
  });

  test("email unlocks maxlength/pattern", () => {
    assert.doesNotThrow(() =>
      createComponent({
        tag: "input",
        attributes: { type: "email", maxlength: 30, pattern: "x@y" },
      }),
    );
  });

  test("checked under text is rejected with a branded message", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "input",
          attributes: {
            type: "text",
            // @ts-expect-error checked requires type: checkbox | radio
            checked: true,
          },
        }),
      /'checked' requires type: checkbox \| radio/,
    );
  });

  test("maxlength under number is rejected with a branded message", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "input",
          attributes: {
            type: "number",
            // @ts-expect-error maxlength requires one of the text-like types
            maxlength: 3,
          },
        }),
      /'maxlength' requires type: text \| password \| email/,
    );
  });

  test("min under checkbox is rejected with a branded message", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "input",
          attributes: {
            type: "checkbox",
            // @ts-expect-error min requires type: number
            min: 0,
          },
        }),
      /'min' requires type: number/,
    );
  });

  test("a checked checkbox renders the checked attribute", () => {
    const { html } = renderComponent(
      createComponent({
        tag: "input",
        attributes: { type: "checkbox", checked: true },
      }),
    );
    assert.match(html, /type="checkbox"/);
    assert.match(html, / checked/);
  });
});
