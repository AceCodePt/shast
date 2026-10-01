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
            { width: readonly ["<length>"] }
          >,
          { width: readonly ["<length>"] }
        >
      >();
    });

    test("accepts multiple token attributes", () => {
      assertType<
        Equal<
          ValidateCSSAttributesConfig<
            SupportedKeywords,
            typeof SYNTAX,
            {
              width: readonly ["<length>"];
              color: readonly ["<color>"];
              opacity: readonly ["<number>"];
            }
          >,
          {
            width: readonly ["<length>"];
            color: readonly ["<color>"];
            opacity: readonly ["<number>"];
          }
        >
      >();
    });

    test("accepts a multi-arm value and validates each arm", () => {
      assertType<
        Equal<
          ValidateCSSAttributesConfig<
            SupportedKeywords,
            typeof SYNTAX,
            { width: readonly ["<integer>", "<length>"] }
          >,
          { width: readonly ["<integer>", "<length>"] }
        >
      >();
    });

    test("accepts quoted literal arms", () => {
      assertType<
        Equal<
          ValidateCSSAttributesConfig<
            SupportedKeywords,
            typeof SYNTAX,
            { display: readonly ["'block'", "'inline'", "'none'"] }
          >,
          { display: readonly ["'block'", "'inline'", "'none'"] }
        >
      >();
    });

    test("accepts a mixed token + literal value", () => {
      assertType<
        Equal<
          ValidateCSSAttributesConfig<
            SupportedKeywords,
            typeof SYNTAX,
            { "letter-spacing": readonly ["'normal'", "<length>"] }
          >,
          { "letter-spacing": readonly ["'normal'", "<length>"] }
        >
      >();
    });

    test("accepts a gate whose self/children bags hold arm arrays", () => {
      assertType<
        Equal<
          ValidateCSSAttributesConfig<
            SupportedKeywords,
            typeof SYNTAX,
            {
              display: {
                block: {
                  self: { width: readonly ["<length>"] };
                  children: {};
                };
              };
            }
          >,
          {
            display: {
              block: {
                self: { width: readonly ["<length>"] };
                children: {};
              };
            };
          }
        >
      >();
    });

    test("rejects an empty arm list", () => {
      assertType<
        Equal<
          ValidateCSSAttributesConfig<
            SupportedKeywords,
            typeof SYNTAX,
            { width: [] }
          >,
          { width: "A CSS attribute must declare at least one arm" }
        >
      >();
    });
  });

  describe("Runtime Validation", () => {
    test("accepts a single token attribute", () => {
      const config = cssAttributeConfig(SUPPORTED_KEYWORDS, SYNTAX, {
        width: ["<length>"],
      });
      assert.deepStrictEqual(config, { width: "<length>" });
    });

    test("accepts multiple token attributes", () => {
      const config = cssAttributeConfig(SUPPORTED_KEYWORDS, SYNTAX, {
        width: ["<length>"],
        color: ["<color>"],
        opacity: ["<number>"],
      });
      assert.deepStrictEqual(config, {
        width: "<length>",
        color: "<color>",
        opacity: "<number>",
      });
    });

    test("joins a multi-arm value with ' | '", () => {
      const config = cssAttributeConfig(SUPPORTED_KEYWORDS, SYNTAX, {
        width: ["<integer>", "<length>"],
      });
      assert.deepStrictEqual(config, { width: "<integer> | <length>" });
    });

    test("accepts quoted literal arms", () => {
      const config = cssAttributeConfig(SUPPORTED_KEYWORDS, SYNTAX, {
        display: ["'block'", "'inline'", "'flex'", "'none'"],
        position: ["'static'", "'relative'", "'absolute'"],
      });
      assert.deepStrictEqual(config, {
        display: "'block' | 'inline' | 'flex' | 'none'",
        position: "'static' | 'relative' | 'absolute'",
      });
    });

    test("accepts a mixed token + quoted literal value", () => {
      const config = cssAttributeConfig(SUPPORTED_KEYWORDS, SYNTAX, {
        "letter-spacing": ["'normal'", "<length>"],
      });
      assert.deepStrictEqual(config, {
        "letter-spacing": "'normal' | <length>",
      });
    });

    test("accepts an empty config", () => {
      const config = cssAttributeConfig(SUPPORTED_KEYWORDS, SYNTAX, {});
      assert.deepStrictEqual(config, {});
    });

    test("normalises a gate's self/children bags to joined strings", () => {
      const config = cssAttributeConfig(SUPPORTED_KEYWORDS, SYNTAX, {
        display: {
          block: {
            self: {
              width: ["<length>"],
              "text-align": ["'left'", "'right'"],
            },
            children: { "font-size": ["<length>"] },
          },
          inline: { self: {}, children: {} },
        },
      });
      assert.deepStrictEqual(config, {
        display: {
          block: {
            self: { width: "<length>", "text-align": "'left' | 'right'" },
            children: { "font-size": "<length>" },
          },
          inline: { self: {}, children: {} },
        },
      });
    });

    test("returns joined strings, not the input arrays", () => {
      const input = { width: ["<length>"] } as const;
      const config = cssAttributeConfig(SUPPORTED_KEYWORDS, SYNTAX, input);
      assert.deepStrictEqual(config, { width: "<length>" });
      assert.notStrictEqual(config, input);
    });
  });

  describe("Error handling", () => {
    test("unknown token throws at runtime", () => {
      assert.throws(
        () =>
          (cssAttributeConfig as any)(SUPPORTED_KEYWORDS, SYNTAX, {
            width: ["<unknown-token>"],
          }),
        /Invalid DSL string/,
      );
    });

    test("an unknown token in one arm throws at runtime", () => {
      assert.throws(
        () =>
          (cssAttributeConfig as any)(SUPPORTED_KEYWORDS, SYNTAX, {
            width: ["<length>", "<unknown-token>"],
          }),
        /Invalid DSL string/,
      );
    });

    test("invalid DSL string throws at runtime", () => {
      assert.throws(
        () =>
          (cssAttributeConfig as any)(SUPPORTED_KEYWORDS, SYNTAX, {
            width: ["xyz"],
          }),
        /Invalid DSL string/,
      );
    });

    test("throws for an empty arm list", () => {
      assert.throws(
        () =>
          cssAttributeConfig(SUPPORTED_KEYWORDS, SYNTAX, {
            // @ts-expect-error an empty arm list is rejected
            width: [],
          }),
        /at least one arm/,
      );
    });

    test("a malformed pattern key names the gate and the key", () => {
      assert.throws(
        () =>
          (cssAttributeConfig as any)(SUPPORTED_KEYWORDS, SYNTAX, {
            display: { "<not-a-real-dsl>": { self: {}, children: {} } },
          }),
        /Invalid pattern key `<not-a-real-dsl>` for gate `display`: not a valid DSL/,
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
        width: ["<length-percentage>"],
      });
      assert.deepStrictEqual(config, { width: "<length-percentage>" });
    });

    test("statically known syntax config passes type validation", () => {
      assertType<
        Equal<
          ValidateCSSAttributesConfig<
            SupportedKeywords,
            typeof SYNTAX,
            { display: readonly ["'none'", "'block'", "'inline'"] }
          >,
          { display: readonly ["'none'", "'block'", "'inline'"] }
        >
      >();
    });
  });
});
