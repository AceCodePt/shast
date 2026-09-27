import test, { describe } from "node:test";
import assert from "node:assert";
import { SUPPORTED_KEYWORDS } from "tsyntax";
import engine from "@/engine/index.ts";
import { cssPropertiesConfig } from "@/css/properties-config/index.ts";
import HTML_GLOBAL_ATTRIBUTES_CONFIG from "@/html/attribute-config/variations/common.ts";
import COMMON_TAGS from "@/html/tag-config/variations/common.ts";
import FULL_TAGS from "@/html/tag-config/variations/full.ts";
import COMMON_SYNTAX from "@/css/syntax-config/variations/common.ts";
import COMMON_ATTRIBUTES from "@/css/attribute-config/variations/common.ts";
import COMMON_PSEUDO from "@/css/pseudo-class-config/variations/common.ts";
import COMMON_QUERIES from "@/css/queries-config/variations/common.ts";
import FULL_SYNTAX from "@/css/syntax-config/variations/full.ts";
import FULL_ATTRIBUTES from "@/css/attribute-config/variations/full.ts";
import FULL_PSEUDO from "@/css/pseudo-class-config/variations/full.ts";
import FULL_QUERIES from "@/css/queries-config/variations/full.ts";

const common = engine({
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig: HTML_GLOBAL_ATTRIBUTES_CONFIG,
  htmlTagConfig: COMMON_TAGS,
  cssSyntaxConfig: COMMON_SYNTAX,
  cssAttributesConfig: COMMON_ATTRIBUTES,
  cssPseudoClassConfig: COMMON_PSEUDO,
  cssPropertiesConfig: cssPropertiesConfig(
    SUPPORTED_KEYWORDS,
    COMMON_SYNTAX,
    {},
  ),
  cssQueriesConfig: COMMON_QUERIES,
});

const full = engine({
  supportedKeywords: SUPPORTED_KEYWORDS,
  htmlAttributesConfig: HTML_GLOBAL_ATTRIBUTES_CONFIG,
  htmlTagConfig: FULL_TAGS,
  cssSyntaxConfig: FULL_SYNTAX,
  cssAttributesConfig: FULL_ATTRIBUTES,
  cssPseudoClassConfig: FULL_PSEUDO,
  cssPropertiesConfig: cssPropertiesConfig(SUPPORTED_KEYWORDS, FULL_SYNTAX, {}),
  cssQueriesConfig: FULL_QUERIES,
});

describe("form[method] gate (shipped common)", () => {
  const { createComponent } = common;

  test("post unlocks enctype", () => {
    assert.doesNotThrow(() =>
      createComponent({
        tag: "form",
        attributes: { method: "post", enctype: "multipart/form-data" },
      }),
    );
  });

  test("get unlocks target/novalidate but not enctype", () => {
    assert.doesNotThrow(() =>
      createComponent({
        tag: "form",
        attributes: { method: "get", target: "_blank", novalidate: true },
      }),
    );
    assert.throws(
      () =>
        createComponent({
          tag: "form",
          attributes: {
            method: "get",
            // @ts-expect-error enctype requires method: post
            enctype: "multipart/form-data",
          },
        }),
      /'enctype' requires method: post/,
    );
  });

  test("dialog unlocks neither enctype, target nor novalidate", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "form",
          attributes: {
            method: "dialog",
            // @ts-expect-error enctype requires method: post
            enctype: "multipart/form-data",
          },
        }),
      /'enctype' requires method: post/,
    );
    assert.throws(
      () =>
        createComponent({
          tag: "form",
          attributes: {
            method: "dialog",
            // @ts-expect-error target requires method: get | post
            target: "_blank",
          },
        }),
      /'target' requires method: get \| post/,
    );
    assert.throws(
      () =>
        createComponent({
          tag: "form",
          attributes: {
            method: "dialog",
            // @ts-expect-error novalidate requires method: get | post
            novalidate: true,
          },
        }),
      /'novalidate' requires method: get \| post/,
    );
  });
});

describe("button[type] gate (shipped full)", () => {
  const { createComponent } = full;

  test("submit unlocks the form-override group", () => {
    assert.doesNotThrow(() =>
      createComponent({
        tag: "button",
        attributes: {
          type: "submit",
          formaction: "/save",
          formmethod: "post",
          formenctype: "multipart/form-data",
          formnovalidate: true,
          formtarget: "_blank",
        },
      }),
    );
  });

  test("omitting type defaults to submit and still unlocks the group", () => {
    assert.doesNotThrow(() =>
      createComponent({ tag: "button", attributes: { formaction: "/save" } }),
    );
    assert.doesNotThrow(() =>
      createComponent({
        tag: "button",
        attributes: { type: undefined, formaction: "/save" },
      }),
    );
  });

  test("button/reset do not unlock the group", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "button",
          attributes: {
            type: "button",
            // @ts-expect-error formaction requires type: submit | undefined
            formaction: "/save",
          },
        }),
      /'formaction' requires type: submit/,
    );
    assert.throws(
      () =>
        createComponent({
          tag: "button",
          attributes: {
            type: "reset",
            // @ts-expect-error formtarget requires type: submit | undefined
            formtarget: "_blank",
          },
        }),
      /'formtarget' requires type: submit/,
    );
  });
});

describe("track[kind] gate (shipped full)", () => {
  const { createComponent } = full;

  test("subtitles unlocks srclang/label/default", () => {
    assert.doesNotThrow(() =>
      createComponent({
        tag: "track",
        attributes: {
          src: "subs.vtt",
          kind: "subtitles",
          srclang: "en",
          label: "English",
          default: true,
        },
      }),
    );
  });

  test("omitting kind defaults to subtitles", () => {
    assert.doesNotThrow(() =>
      createComponent({
        tag: "track",
        attributes: { src: "subs.vtt", srclang: "en" },
      }),
    );
  });

  test("metadata unlocks none of srclang/label/default", () => {
    assert.throws(
      () =>
        createComponent({
          tag: "track",
          attributes: {
            src: "s.vtt",
            kind: "metadata",
            // @ts-expect-error srclang is not allowed for metadata tracks
            srclang: "en",
          },
        }),
      /'srclang' requires kind:/,
    );
    assert.throws(
      () =>
        createComponent({
          tag: "track",
          attributes: {
            src: "s.vtt",
            kind: "metadata",
            // @ts-expect-error label is not allowed for metadata tracks
            label: "x",
          },
        }),
      /'label' requires kind:/,
    );
    assert.throws(
      () =>
        createComponent({
          tag: "track",
          attributes: {
            src: "s.vtt",
            kind: "metadata",
            // @ts-expect-error default is not allowed for metadata tracks
            default: true,
          },
        }),
      /'default' requires kind:/,
    );
  });
});
