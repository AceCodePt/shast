import test, { describe } from "node:test";
import assert from "node:assert";
import { SUPPORTED_KEYWORDS, type SupportedKeywords } from "tsyntax";
import { htmlAttributeConfig } from "@/html/attribute-config/index.ts";
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
    test("accepts valid DSL strings", () => {
      assertType<
        Equal<
          ValidateHTMLAttributesConfig<
            SupportedKeywords,
            { id: "string | undefined" }
          >,
          { id: "string | undefined" }
        >
      >();
    });

    test("accepts multiple valid DSL strings", () => {
      assertType<
        Equal<
          ValidateHTMLAttributesConfig<
            SupportedKeywords,
            {
              id: "string | undefined";
              dir: "'ltr' | 'rtl' | 'auto' | undefined";
              hidden: "boolean | undefined";
            }
          >,
          {
            id: "string | undefined";
            dir: "'ltr' | 'rtl' | 'auto' | undefined";
            hidden: "boolean | undefined";
          }
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
            { id: "string | undefined" }
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
            { tabindex: "number | undefined" }
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
            { dir: "'ltr' | 'rtl' | 'auto' | undefined" }
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
            { draggable: "boolean | undefined" }
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
            { contenteditable: "'plaintext-only' | boolean | undefined" }
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
              id: "string | undefined";
              tabindex: "number | undefined";
              dir: "'ltr' | 'rtl' | 'auto' | undefined";
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
    test("accepts a single string attribute", () => {
      const config = htmlAttributeConfig(SUPPORTED_KEYWORDS, {
        id: "string | undefined",
      });
      assert.deepStrictEqual(config, { id: "string | undefined" });
    });

    test("accepts multiple attributes with various DSL strings", () => {
      const config = htmlAttributeConfig(SUPPORTED_KEYWORDS, {
        id: "string | undefined",
        tabindex: "number | undefined",
        dir: "'ltr' | 'rtl' | 'auto' | undefined",
        hidden: "boolean | undefined",
      });
      assert.deepStrictEqual(config, {
        id: "string | undefined",
        tabindex: "number | undefined",
        dir: "'ltr' | 'rtl' | 'auto' | undefined",
        hidden: "boolean | undefined",
      });
    });

    test("returns the same object reference", () => {
      const input = { id: "string | undefined" } as const;
      const config = htmlAttributeConfig(SUPPORTED_KEYWORDS, input);
      assert.strictEqual(config, input);
    });

    test("accepts literal string union attributes", () => {
      const config = htmlAttributeConfig(SUPPORTED_KEYWORDS, {
        dir: "'ltr' | 'rtl' | 'auto' | undefined",
        translate: "'yes' | 'no' | undefined",
      });
      assert.deepStrictEqual(config, {
        dir: "'ltr' | 'rtl' | 'auto' | undefined",
        translate: "'yes' | 'no' | undefined",
      });
    });

    test("accepts boolean union attributes", () => {
      const config = htmlAttributeConfig(SUPPORTED_KEYWORDS, {
        draggable: "boolean | undefined",
        spellcheck: "boolean | undefined",
      });
      assert.deepStrictEqual(config, {
        draggable: "boolean | undefined",
        spellcheck: "boolean | undefined",
      });
    });

    test("accepts literal boolean union", () => {
      const config = htmlAttributeConfig(SUPPORTED_KEYWORDS, {
        contenteditable: "'plaintext-only' | boolean | undefined",
      });
      assert.deepStrictEqual(config, {
        contenteditable: "'plaintext-only' | boolean | undefined",
      });
    });
  });

  describe("Error handling", () => {
    test("throws for invalid DSL string in an attribute value", () => {
      assert.throws(
        () =>
          // @ts-expect-error
          htmlAttributeConfig(SUPPORTED_KEYWORDS, { id: "xyz" }),
        /Invalid DSL string/,
      );
    });

    test("throws for partially invalid union", () => {
      assert.throws(
        () =>
          // @ts-expect-error
          htmlAttributeConfig(SUPPORTED_KEYWORDS, { id: "string | xyz" }),
        /Invalid DSL string/,
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
        id: "string | undefined",
        hidden: "boolean | undefined",
      } as const;
      const config = htmlAttributeConfig(SUPPORTED_KEYWORDS, input);
      assertType<
        Equal<
          typeof config,
          {
            readonly id: "string | undefined";
            readonly hidden: "boolean | undefined";
          }
        >
      >();
      assert.deepStrictEqual(config, input);
    });

    test("object reference identity preserved", () => {
      const input = { id: "string | undefined" } as const;
      const config = htmlAttributeConfig(SUPPORTED_KEYWORDS, input);
      assert.strictEqual(config, input);
    });

    test("mutable config is accepted without readonly constraint", () => {
      const input = { id: "string | undefined" } as const;
      const config = htmlAttributeConfig(SUPPORTED_KEYWORDS, input);
      assert.strictEqual(config, input);
    });
  });
});

describe("HTML Attributes — Variation: minimal.ts", () => {
  test("contains expected keys", () => {
    const keys = Object.keys(minimalAttributes).sort();
    assert.deepStrictEqual(keys, ["class", "id", "role", "style", "tabindex"]);
  });

  test("each value is a valid DSL string", () => {
    for (const key of Object.keys(minimalAttributes)) {
      assert.doesNotThrow(() =>
        htmlAttributeConfig(SUPPORTED_KEYWORDS, {
          [key]: (minimalAttributes as Record<string, string>)[key]!,
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

  test("each value is a valid DSL string", () => {
    for (const key of Object.keys(commonAttributes)) {
      assert.doesNotThrow(() =>
        htmlAttributeConfig(SUPPORTED_KEYWORDS, {
          [key]: (commonAttributes as Record<string, string>)[key]!,
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

  test("each value is a valid DSL string", () => {
    for (const key of Object.keys(fullAttributes)) {
      assert.doesNotThrow(() =>
        htmlAttributeConfig(SUPPORTED_KEYWORDS, {
          [key]: (fullAttributes as Record<string, string>)[key]!,
        }),
      );
    }
  });
});
