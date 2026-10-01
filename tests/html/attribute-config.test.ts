import test, { describe } from "node:test";
import assert from "node:assert";
import { SUPPORTED_KEYWORDS, type SupportedKeywords } from "tsyntax";
import {
  htmlAttributeConfig,
  normalizeHTMLAttributesConfig,
} from "@/html/attribute-config/index.ts";
import type {
  InferHTMLAttributesConfig,
  ValidateHTMLAttributesConfig,
} from "@/html/attribute-config/types.ts";
import { assertType, type Equal } from "../type-utils.ts";

import minimalAttributes from "@/html/attribute-config/variations/minimal.ts";
import commonAttributes from "@/html/attribute-config/variations/common.ts";
import fullAttributes from "@/html/attribute-config/variations/full.ts";

describe("htmlAttributeConfig", () => {
  describe("Type Validation", () => {
    test("accepts a single-arm attribute", () => {
      assertType<
        Equal<
          ValidateHTMLAttributesConfig<
            SupportedKeywords,
            { id: readonly ["string", "undefined"] }
          >,
          { id: readonly ["string", "undefined"] }
        >
      >();
    });

    test("accepts multiple attributes with several arms", () => {
      assertType<
        Equal<
          ValidateHTMLAttributesConfig<
            SupportedKeywords,
            {
              id: readonly ["string", "undefined"];
              dir: readonly ["'ltr'", "'rtl'", "'auto'", "undefined"];
              hidden: readonly ["boolean", "undefined"];
            }
          >,
          {
            id: readonly ["string", "undefined"];
            dir: readonly ["'ltr'", "'rtl'", "'auto'", "undefined"];
            hidden: readonly ["boolean", "undefined"];
          }
        >
      >();
    });

    test("rejects an empty arm list", () => {
      assertType<
        Equal<
          ValidateHTMLAttributesConfig<
            SupportedKeywords,
            { id: [] }
          >,
          { id: "An HTML attribute must declare at least one arm" }
        >
      >();
    });
  });

  describe("Type Inference", () => {
    test("single string attribute infers correctly", () => {
      assertType<
        Equal<
          InferHTMLAttributesConfig<
            SupportedKeywords,
            { id: readonly ["string", "undefined"] }
          >,
          { id: string | undefined }
        >
      >();
    });

    test("number attribute infers correctly", () => {
      assertType<
        Equal<
          InferHTMLAttributesConfig<
            SupportedKeywords,
            { tabindex: readonly ["number", "undefined"] }
          >,
          { tabindex: number | undefined }
        >
      >();
    });

    test("string literal union infers correctly", () => {
      assertType<
        Equal<
          InferHTMLAttributesConfig<
            SupportedKeywords,
            { dir: readonly ["'ltr'", "'rtl'", "'auto'", "undefined"] }
          >,
          { dir: "ltr" | "rtl" | "auto" | undefined }
        >
      >();
    });

    test("boolean attribute infers correctly", () => {
      assertType<
        Equal<
          InferHTMLAttributesConfig<
            SupportedKeywords,
            { draggable: readonly ["boolean", "undefined"] }
          >,
          { draggable: boolean | undefined }
        >
      >();
    });

    test("mixed literal + primitive union infers correctly", () => {
      assertType<
        Equal<
          InferHTMLAttributesConfig<
            SupportedKeywords,
            { contenteditable: readonly ["'plaintext-only'", "boolean", "undefined"] }
          >,
          { contenteditable: "plaintext-only" | boolean | undefined }
        >
      >();
    });

    test("multiple attributes infer as a mapped object", () => {
      assertType<
        Equal<
          InferHTMLAttributesConfig<
            SupportedKeywords,
            {
              id: readonly ["string", "undefined"];
              tabindex: readonly ["number", "undefined"];
              dir: readonly ["'ltr'", "'rtl'", "'auto'", "undefined"];
            }
          >,
          {
            id: string | undefined;
            tabindex: number | undefined;
            dir: "ltr" | "rtl" | "auto" | undefined;
          }
        >
      >();
    });
  });

  describe("Runtime Validation", () => {
    test("accepts a single attribute and joins its arms", () => {
      const config = htmlAttributeConfig(SUPPORTED_KEYWORDS, {
        id: ["string", "undefined"],
      });
      assert.deepStrictEqual(config, { id: "string | undefined" });
    });

    test("joins a multi-arm value with ' | '", () => {
      const config = htmlAttributeConfig(SUPPORTED_KEYWORDS, {
        dir: ["'ltr'", "'rtl'", "'auto'", "undefined"],
      });
      assert.deepStrictEqual(config, {
        dir: "'ltr' | 'rtl' | 'auto' | undefined",
      });
    });

    test("accepts multiple attributes with various DSL arms", () => {
      const config = htmlAttributeConfig(SUPPORTED_KEYWORDS, {
        id: ["string", "undefined"],
        tabindex: ["number", "undefined"],
        dir: ["'ltr'", "'rtl'", "'auto'", "undefined"],
        hidden: ["boolean", "undefined"],
      });
      assert.deepStrictEqual(config, {
        id: "string | undefined",
        tabindex: "number | undefined",
        dir: "'ltr' | 'rtl' | 'auto' | undefined",
        hidden: "boolean | undefined",
      });
    });

    test("returns joined strings, not the input arrays", () => {
      const input = { id: ["string", "undefined"] } as const;
      const config = htmlAttributeConfig(SUPPORTED_KEYWORDS, input);
      assert.deepStrictEqual(config, { id: "string | undefined" });
      assert.notStrictEqual(config, input);
    });

    test("normalizeHTMLAttributesConfig joins every arm array", () => {
      const normalised = normalizeHTMLAttributesConfig(SUPPORTED_KEYWORDS, {
        id: ["string", "undefined"],
        dir: ["'ltr'", "'rtl'"],
        hidden: {
          undefined: {},
          true: { "aria-hidden": ["boolean", "'true'"] },
        },
      });
      assert.deepStrictEqual(normalised, {
        id: "string | undefined",
        dir: "'ltr' | 'rtl'",
        hidden: {
          undefined: {},
          true: { "aria-hidden": "boolean | 'true'" },
        },
      });
    });

    test("normalises a complex value's bags to joined strings", () => {
      const config = htmlAttributeConfig(SUPPORTED_KEYWORDS, {
        id: {
          undefined: {},
          "todo-1": { "data-kind": ["'literal'"] },
          "`todo-${number}`": { "data-kind": ["'a'", "'b'"] },
        },
      });
      assert.deepStrictEqual(config, {
        id: {
          undefined: {},
          "todo-1": { "data-kind": "'literal'" },
          "`todo-${number}`": { "data-kind": "'a' | 'b'" },
        },
      });
    });

    test("accepts literal boolean union arms", () => {
      const config = htmlAttributeConfig(SUPPORTED_KEYWORDS, {
        contenteditable: ["'plaintext-only'", "boolean", "undefined"],
      });
      assert.deepStrictEqual(config, {
        contenteditable: "'plaintext-only' | boolean | undefined",
      });
    });
  });

  describe("Error handling", () => {
    test("throws for invalid DSL arm in an attribute value", () => {
      assert.throws(
        () =>
          // @ts-expect-error
          htmlAttributeConfig(SUPPORTED_KEYWORDS, { id: ["xyz"] }),
        /Invalid DSL string/,
      );
    });

    test("throws for an unknown arm in a multi-arm value", () => {
      assert.throws(
        () =>
          // @ts-expect-error
          htmlAttributeConfig(SUPPORTED_KEYWORDS, { id: ["string", "xyz"] }),
        /Invalid DSL string/,
      );
    });

    test("throws for an empty arm list", () => {
      assert.throws(
        () =>
          htmlAttributeConfig(SUPPORTED_KEYWORDS, {
            // @ts-expect-error an empty arm list is rejected
            id: [],
          }),
        /at least one arm/,
      );
    });

    test("a malformed pattern key names the gate and the key", () => {
      assert.throws(
        () =>
          htmlAttributeConfig(SUPPORTED_KEYWORDS, {
            id: { "<not-a-real-dsl>": {} },
          }),
        /Invalid pattern key `<not-a-real-dsl>` for gate `id`: not a valid DSL/,
      );
    });
  });

  describe("Edge Cases", () => {
    test("empty config is accepted", () => {
      const config = htmlAttributeConfig(SUPPORTED_KEYWORDS, {});
      assert.deepStrictEqual(config, {});
    });

    test("typed as const config preserves readonly type", () => {
      const input = {
        id: ["string", "undefined"],
        hidden: ["boolean", "undefined"],
      } as const;
      const config = htmlAttributeConfig(SUPPORTED_KEYWORDS, input);
      assertType<
        Equal<
          typeof config,
          {
            readonly id: readonly ["string", "undefined"];
            readonly hidden: readonly ["boolean", "undefined"];
          }
        >
      >();
      assert.deepStrictEqual(config, {
        id: "string | undefined",
        hidden: "boolean | undefined",
      });
    });
  });
});

describe("HTML Attributes — Variation: minimal.ts", () => {
  test("contains expected keys", () => {
    const keys = Object.keys(minimalAttributes).sort();
    assert.deepStrictEqual(keys, ["class", "id", "role", "style", "tabindex"]);
  });

  test("each value is a valid arm array", () => {
    for (const key of Object.keys(minimalAttributes)) {
      assert.doesNotThrow(() =>
        htmlAttributeConfig(SUPPORTED_KEYWORDS, {
          [key]: (minimalAttributes as Record<string, readonly string[]>)[key]!,
        }),
      );
    }
  });
});

describe("HTML Attributes — Variation: common.ts", () => {
  test("contains expected keys", () => {
    const keys = Object.keys(commonAttributes).sort();
    assert.deepStrictEqual(keys, [
      "class",
      "dir",
      "id",
      "lang",
      "role",
      "style",
      "tabindex",
      "title",
    ]);
  });

  test("each value is a valid arm array", () => {
    for (const key of Object.keys(commonAttributes)) {
      assert.doesNotThrow(() =>
        htmlAttributeConfig(SUPPORTED_KEYWORDS, {
          [key]: (commonAttributes as Record<string, readonly string[]>)[key]!,
        }),
      );
    }
  });
});

describe("HTML Attributes — Variation: full.ts", () => {
  test("contains all major attribute groups", () => {
    const keys = Object.keys(fullAttributes);
    assert.ok(keys.includes("id"), "should have identity attrs");
    assert.ok(keys.includes("lang"), "should have i18n attrs");
    assert.ok(keys.includes("hidden"), "should have visibility attrs");
    assert.ok(keys.includes("contenteditable"), "should have editing attrs");
    assert.ok(keys.includes("role"), "should have role");
    assert.ok(keys.includes("aria-label"), "should have ARIA attrs");
    assert.ok(keys.includes("itemscope"), "should have microdata attrs");
    assert.ok(keys.includes("popover"), "should have popover attrs");
    assert.ok(keys.includes("nonce"), "should have misc attrs");
    assert.ok(keys.includes("data-*"), "should have data-* wildcard");
    assert.ok(keys.length >= 50, `expected 50+ attrs, got ${keys.length}`);
  });

  test("each value is a valid arm array", () => {
    for (const key of Object.keys(fullAttributes)) {
      assert.doesNotThrow(() =>
        htmlAttributeConfig(SUPPORTED_KEYWORDS, {
          [key]: (fullAttributes as Record<string, readonly string[]>)[key]!,
        }),
      );
    }
  });
});
