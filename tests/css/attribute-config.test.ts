import test, { describe } from "node:test";
import assert from "node:assert";
import { SUPPORTED_KEYWORDS, type SupportedKeywords } from "tsyntax";
import { cssAttributeConfig } from "@/css/attribute-config/index.ts";
import type { ValidateCSSAttributesConfig } from "@/css/attribute-config/types.ts";
import { assertType, type Equal } from "../type-utils.ts";

const SYNTAX = {
  "<length>": "`${number}${'px' | 'rem' | 'em'}`",
  "<color>": "`#${string}` | 'transparent' | 'currentColor'",
  "<number>": "`${number}`",
  "<integer>": "`${bigint}`",
  "<time>": "`${number}${'s' | 'ms'}`",
  "<line-style>": "'none' | 'solid' | 'dashed' | 'dotted'",
} as const;

describe("cssAttributeConfig", () => {
  describe("Type Validation", () => {
    test("accepts a single token attribute", () => {
      assertType<
        Equal<
          ValidateCSSAttributesConfig<
            SupportedKeywords,
            typeof SYNTAX,
            { width: "<length>" }
          >,
          { width: "<length>" }
        >
      >();
    });

    test("accepts multiple token attributes", () => {
      assertType<
        Equal<
          ValidateCSSAttributesConfig<
            SupportedKeywords,
            typeof SYNTAX,
            { width: "<length>"; color: "<color>"; opacity: "<number>" }
          >,
          { width: "<length>"; color: "<color>"; opacity: "<number>" }
        >
      >();
    });

    test("accepts quoted literal values", () => {
      assertType<
        Equal<
          ValidateCSSAttributesConfig<
            SupportedKeywords,
            typeof SYNTAX,
            { display: "'block' | 'inline' | 'none'" }
          >,
          { display: "'block' | 'inline' | 'none'" }
        >
      >();
    });

    test("accepts mixed token + literal union", () => {
      assertType<
        Equal<
          ValidateCSSAttributesConfig<
            SupportedKeywords,
            typeof SYNTAX,
            { "letter-spacing": "'normal' | <length>" }
          >,
          { "letter-spacing": "'normal' | <length>" }
        >
      >();
    });

    test("accepts union of two tokens", () => {
      assertType<
        Equal<
          ValidateCSSAttributesConfig<
            SupportedKeywords,
            typeof SYNTAX,
            { tint: "<color> | <length>" }
          >,
          { tint: "<color> | <length>" }
        >
      >();
    });
  });

  describe("Runtime Validation", () => {
    test("accepts a single token attribute", () => {
      const config = cssAttributeConfig(SUPPORTED_KEYWORDS, SYNTAX, {
        width: "<length>",
      });
      assert.deepStrictEqual(config, { width: "<length>" });
    });

    test("accepts multiple token attributes", () => {
      const config = cssAttributeConfig(SUPPORTED_KEYWORDS, SYNTAX, {
        width: "<length>",
        color: "<color>",
        opacity: "<number>",
      });
      assert.deepStrictEqual(config, {
        width: "<length>",
        color: "<color>",
        opacity: "<number>",
      });
    });

    test("accepts quoted literal values", () => {
      const config = cssAttributeConfig(SUPPORTED_KEYWORDS, SYNTAX, {
        display: "'block' | 'inline' | 'flex' | 'none'",
        position: "'static' | 'relative' | 'absolute'",
      });
      assert.deepStrictEqual(config, {
        display: "'block' | 'inline' | 'flex' | 'none'",
        position: "'static' | 'relative' | 'absolute'",
      });
    });

    test("accepts a mixed token + quoted literal union", () => {
      const config = cssAttributeConfig(SUPPORTED_KEYWORDS, SYNTAX, {
        "letter-spacing": "'normal' | <length>",
      });
      assert.deepStrictEqual(config, {
        "letter-spacing": "'normal' | <length>",
      });
    });

    test("accepts an empty config", () => {
      const config = cssAttributeConfig(SUPPORTED_KEYWORDS, SYNTAX, {});
      assert.deepStrictEqual(config, {});
    });

    test("returns the same object reference", () => {
      const input = { width: "<length>" } as const;
      const config = cssAttributeConfig(SUPPORTED_KEYWORDS, SYNTAX, input);
      assert.strictEqual(config, input);
    });

    test("accepts union of two tokens", () => {
      const config = cssAttributeConfig(SUPPORTED_KEYWORDS, SYNTAX, {
        "border-style": "<line-style>",
      });
      assert.deepStrictEqual(config, { "border-style": "<line-style>" });
    });
  });

  describe("Error handling", () => {
    test("unknown token throws at runtime", () => {
      assert.throws(
        () =>
          (cssAttributeConfig as any)(SUPPORTED_KEYWORDS, SYNTAX, {
            width: "<unknown-token>",
          }),
        /Invalid DSL string/,
      );
    });

    test("invalid DSL string throws at runtime", () => {
      assert.throws(
        () =>
          (cssAttributeConfig as any)(SUPPORTED_KEYWORDS, SYNTAX, {
            width: "xyz",
          }),
        /Invalid DSL string/,
      );
    });

    test("partially invalid union throws at runtime", () => {
      assert.throws(
        () =>
          (cssAttributeConfig as any)(SUPPORTED_KEYWORDS, SYNTAX, {
            width: "<length> | xyz",
          }),
        /Invalid DSL string/,
      );
    });
  });

  describe("Edge Cases", () => {
    test("empty config is accepted", () => {
      const config = cssAttributeConfig(SUPPORTED_KEYWORDS, SYNTAX, {});
      assert.deepStrictEqual(config, {});
    });

    test("syntax token with chained references resolves at runtime", () => {
      const extendedSyntax = {
        ...SYNTAX,
        "<length-percentage>": "<length> | <percentage>",
        "<percentage>": "`${number}%`",
      } as const;
      const config = cssAttributeConfig(SUPPORTED_KEYWORDS, extendedSyntax, {
        width: "<length-percentage>",
      });
      assert.deepStrictEqual(config, { width: "<length-percentage>" });
    });

    test("statically known syntax config passes type validation", () => {
      assertType<
        Equal<
          ValidateCSSAttributesConfig<
            SupportedKeywords,
            typeof SYNTAX,
            { display: "'none' | 'block' | 'inline'" }
          >,
          { display: "'none' | 'block' | 'inline'" }
        >
      >();
    });
  });
});
