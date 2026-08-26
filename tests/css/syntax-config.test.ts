import test, { describe } from "node:test";
import assert from "node:assert";
import { SUPPORTED_KEYWORDS, type SupportedKeywords } from "tsyntax";
import { cssSyntaxConfig } from "@/css/syntax-config/index.ts";
import type {
  InferCSSSyntax,
  InferCSSSyntaxConfig,
  ValidateCSSSyntaxConfig,
} from "@/css/syntax-config/types.ts";
import { assertType, type Equal } from "../type-utils.ts";

describe("cssSyntaxConfig", () => {
  describe("Type Validation", () => {
    test("accepts a valid syntax token", () => {
      assertType<
        Equal<
          ValidateCSSSyntaxConfig<
            SupportedKeywords,
            { "<length>": "`${number}${'px' | 'rem'}`" }
          >,
          { "<length>": "`${number}${'px' | 'rem'}`" }
        >
      >();
    });

    test("accepts multiple syntax tokens", () => {
      assertType<
        Equal<
          ValidateCSSSyntaxConfig<
            SupportedKeywords,
            {
              "<integer>": "`${bigint}`";
              "<number>": "`${number}`";
              "<percentage>": "`${number}%`";
            }
          >,
          {
            "<integer>": "`${bigint}`";
            "<number>": "`${number}`";
            "<percentage>": "`${number}%`";
          }
        >
      >();
    });

    test("accepts token references (recursive keyword resolution)", () => {
      assertType<
        Equal<
          ValidateCSSSyntaxConfig<
            SupportedKeywords,
            {
              "<length>": "`${number}${'px'}`";
              "<percentage>": "`${number}%`";
              "<length-percentage>": "<length> | <percentage>";
            }
          >,
          {
            "<length>": "`${number}${'px'}`";
            "<percentage>": "`${number}%`";
            "<length-percentage>": "<length> | <percentage>";
          }
        >
      >();
    });

    test("accepts complex chained token references", () => {
      assertType<
        Equal<
          ValidateCSSSyntaxConfig<
            SupportedKeywords,
            {
              "<length>": "`${number}${'px'}`";
              "<percentage>": "`${number}%`";
              "<length-percentage>": "<length> | <percentage>";
              "<track-breadth>": "<length-percentage> | 'auto'";
            }
          >,
          {
            "<length>": "`${number}${'px'}`";
            "<percentage>": "`${number}%`";
            "<length-percentage>": "<length> | <percentage>";
            "<track-breadth>": "<length-percentage> | 'auto'";
          }
        >
      >();
    });
  });

  describe("Type Inference", () => {
    test("infers types from a syntax config", () => {
      assertType<
        Equal<
          InferCSSSyntaxConfig<
            SupportedKeywords,
            {
              "<integer>": "`${bigint}`";
              "<number>": "`${number}`";
              "<percentage>": "`${number}%`";
            }
          >,
          {
            "<integer>": `${bigint}`;
            "<number>": `${number}`;
            "<percentage>": `${number}%`;
          }
        >
      >();
    });

    test("infers type for a single token via InferCSSSyntax", () => {
      assertType<
        Equal<
          InferCSSSyntax<
            SupportedKeywords,
            { "<length>": "`${number}${'px'}`" },
            "<length>"
          >,
          `${number}${"px"}`
        >
      >();
    });

    test("returns never for unknown token via InferCSSSyntax", () => {
      assertType<
        Equal<
          InferCSSSyntax<
            SupportedKeywords,
            { "<length>": "`${number}${'px'}`" },
            "<unknown-token>"
          >,
          never
        >
      >();
    });
  });

  describe("Runtime Validation", () => {
    test("accepts a single syntax token", () => {
      const config = cssSyntaxConfig(SUPPORTED_KEYWORDS, {
        "<length>": "`${number}${'px' | 'rem'}`",
      });
      assert.deepStrictEqual(config, {
        "<length>": "`${number}${'px' | 'rem'}`",
      });
    });

    test("accepts multiple syntax tokens", () => {
      const config = cssSyntaxConfig(SUPPORTED_KEYWORDS, {
        "<integer>": "`${bigint}`",
        "<number>": "`${number}`",
      });
      assert.deepStrictEqual(config, {
        "<integer>": "`${bigint}`",
        "<number>": "`${number}`",
      });
    });

    test("accepts token references (recursive keyword resolution)", () => {
      const config = cssSyntaxConfig(SUPPORTED_KEYWORDS, {
        "<length>": "`${number}${'px' | 'rem'}`",
        "<percentage>": "`${number}%`",
        "<length-percentage>": "<length> | <percentage>",
      });
      assert.deepStrictEqual(config, {
        "<length>": "`${number}${'px' | 'rem'}`",
        "<percentage>": "`${number}%`",
        "<length-percentage>": "<length> | <percentage>",
      });
    });

    test("accepts chained token references", () => {
      const config = cssSyntaxConfig(SUPPORTED_KEYWORDS, {
        "<length>": "`${number}${'px'}`",
        "<percentage>": "`${number}%`",
        "<length-percentage>": "<length> | <percentage>",
        "<track-breadth>": "<length-percentage> | 'auto' | 'min-content'",
      });
      assert.deepStrictEqual(config, {
        "<length>": "`${number}${'px'}`",
        "<percentage>": "`${number}%`",
        "<length-percentage>": "<length> | <percentage>",
        "<track-breadth>": "<length-percentage> | 'auto' | 'min-content'",
      });
    });

    test("returns the same object reference", () => {
      const input = {
        "<length>": "`${number}${'px'}`" as const,
      } as const;
      const config = cssSyntaxConfig(SUPPORTED_KEYWORDS, input);
      assert.strictEqual(config, input);
    });
  });

  describe("Error handling", () => {
    test("throws for key not wrapped in <>", () => {
      assert.throws(
        () =>
          cssSyntaxConfig(SUPPORTED_KEYWORDS, {
            // @ts-expect-error
            length: "`${number}${'px'}`",
          }),
        /should start and end with/,
      );
    });

    test("throws for invalid DSL string in value", () => {
      assert.throws(
        () =>
          cssSyntaxConfig(SUPPORTED_KEYWORDS, {
            // @ts-expect-error
            "<length>": "xyz",
          }),
        /Invalid DSL string/,
      );
    });

    test("throws for unknown token reference", () => {
      assert.throws(
        () =>
          cssSyntaxConfig(SUPPORTED_KEYWORDS, {
            // @ts-expect-error
            "<length>": "<unknown-token>",
          }),
        /Invalid DSL string/,
      );
    });

    test("throws for partially valid union referencing unknown token", () => {
      assert.throws(
        () =>
          cssSyntaxConfig(SUPPORTED_KEYWORDS, {
            // @ts-expect-error
            "<length>": "`${number}${'px'}` | <unknown-token>",
          }),
        /Invalid DSL string/,
      );
    });
  });

  describe("Circular Reference Detection", () => {
    test("throws for self-referencing token", () => {
      assert.throws(
        () =>
          cssSyntaxConfig(SUPPORTED_KEYWORDS, {
            "<a>": "<a>",
          }),
        /Circular reference/,
      );
    });

    test("throws for indirect circular reference (a -> b -> a)", () => {
      assert.throws(
        () =>
          cssSyntaxConfig(SUPPORTED_KEYWORDS, {
            "<a>": "<b>",
            "<b>": "<a>",
          }),
        /Circular reference/,
      );
    });

    test("throws for longer cycle (a -> b -> c -> a)", () => {
      assert.throws(
        () =>
          cssSyntaxConfig(SUPPORTED_KEYWORDS, {
            "<a>": "<b>",
            "<b>": "<c>",
            "<c>": "<a>",
          }),
        /Circular reference/,
      );
    });

    test("throws for self-reference in union", () => {
      assert.throws(
        () =>
          cssSyntaxConfig(SUPPORTED_KEYWORDS, {
            "<length>": "`${number}${'px'}`",
            "<length-percentage>": "<length> | <length-percentage>",
          }),
        /Circular reference/,
      );
    });

    test("throws for cross-cycle in union (a -> b | c, b -> a)", () => {
      assert.throws(
        () =>
          cssSyntaxConfig(SUPPORTED_KEYWORDS, {
            "<a>": "<b> | <c>",
            "<b>": "<a>",
            "<c>": "`${number}%`",
          }),
        /Circular reference/,
      );
    });

    test("accepts acyclic references", () => {
      const config = cssSyntaxConfig(SUPPORTED_KEYWORDS, {
        "<length>": "`${number}${'px'}`",
        "<percentage>": "`${number}%`",
        "<length-percentage>": "<length> | <percentage>",
      });
      assert.ok(config);
    });
  });

  describe("Edge Cases", () => {
    test("empty config is accepted", () => {
      const config = cssSyntaxConfig(SUPPORTED_KEYWORDS, {});
      assert.deepStrictEqual(config, {});
    });

    test("config with only keyword references passes", () => {
      const config = cssSyntaxConfig(SUPPORTED_KEYWORDS, {
        "<length>": "`${number}${'px'}`",
        "<length-percentage>": "<length> | <percentage>",
        "<percentage>": "`${number}%`",
      });
      assert.ok(config);
    });

    test("template literal with no interpolations is accepted", () => {
      const config = cssSyntaxConfig(SUPPORTED_KEYWORDS, {
        "<custom>": "`plain`",
      });
      assert.deepStrictEqual(config, { "<custom>": "`plain`" });
    });

    test("single-character key inside <> is accepted", () => {
      const config = cssSyntaxConfig(SUPPORTED_KEYWORDS, {
        "<x>": "`${number}`",
      });
      assert.deepStrictEqual(config, { "<x>": "`${number}`" });
    });
  });
});
