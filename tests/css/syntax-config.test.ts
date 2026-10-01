import test, { describe } from "node:test";
import assert from "node:assert";
import {
  SUPPORTED_KEYWORDS,
  parseValueAgainstDSL,
  type SupportedKeywords,
} from "tsyntax";
import { cssSyntaxConfig } from "@/css/syntax-config/index.ts";
import MINIMAL_SYNTAX from "@/css/syntax-config/variations/minimal.ts";
import COMMON_SYNTAX from "@/css/syntax-config/variations/common.ts";
import FULL_SYNTAX from "@/css/syntax-config/variations/full.ts";
import type {
  CSSSyntaxKeywords,
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
            { "<length>": ["`${number}${'px' | 'rem'}`"] }
          >,
          { "<length>": readonly ["`${number}${'px' | 'rem'}`"] }
        >
      >();
    });

    test("accepts multiple syntax tokens", () => {
      assertType<
        Equal<
          ValidateCSSSyntaxConfig<
            SupportedKeywords,
            {
              "<integer>": ["`${bigint}`"];
              "<number>": ["`${number}`"];
              "<percentage>": ["`${number}%`"];
            }
          >,
          {
            "<integer>": readonly ["`${bigint}`"];
            "<number>": readonly ["`${number}`"];
            "<percentage>": readonly ["`${number}%`"];
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
              "<length>": ["`${number}${'px'}`"];
              "<percentage>": ["`${number}%`"];
              "<length-percentage>": ["<length>", "<percentage>"];
            }
          >,
          {
            "<length>": readonly ["`${number}${'px'}`"];
            "<percentage>": readonly ["`${number}%`"];
            "<length-percentage>": readonly ["<length>", "<percentage>"];
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
              "<length>": ["`${number}${'px'}`"];
              "<percentage>": ["`${number}%`"];
              "<length-percentage>": ["<length>", "<percentage>"];
              "<track-breadth>": ["<length-percentage>", "'auto'"];
            }
          >,
          {
            "<length>": readonly ["`${number}${'px'}`"];
            "<percentage>": readonly ["`${number}%`"];
            "<length-percentage>": readonly ["<length>", "<percentage>"];
            "<track-breadth>": readonly ["<length-percentage>", "'auto'"];
          }
        >
      >();
    });

    test("rejects an empty arm list", () => {
      assertType<
        Equal<
          ValidateCSSSyntaxConfig<SupportedKeywords, { "<length>": [] }>,
          { "<length>": "A syntax token must declare at least one arm" }
        >
      >();
    });

    test("validates each arm independently, keeping a template's internal pipe", () => {
      // `DSLValidate` would split `` `${number}|${string}` `` at the `|` and
      // reject the halves; `DSLValidateArm` reads it as one arm.
      assertType<
        Equal<
          ValidateCSSSyntaxConfig<
            SupportedKeywords,
            { "<custom>": ["`${number}|${string}`", "'a'"] }
          >,
          { "<custom>": readonly ["`${number}|${string}`", "'a'"] }
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
              "<integer>": ["`${bigint}`"];
              "<number>": ["`${number}`"];
              "<percentage>": ["`${number}%`"];
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

    test("infers over every arm of a multi-arm token", () => {
      assertType<
        Equal<
          InferCSSSyntaxConfig<
            SupportedKeywords,
            {
              "<calc>": ["`calc(${string})`"];
              "<var>": ["`var(${string})`"];
              "<length>": ["`${number}${'px'}`", "<calc>", "<var>"];
            }
          >,
          {
            "<calc>": `calc(${string})`;
            "<var>": `var(${string})`;
            "<length>": `${number}${"px"}` | `calc(${string})` | `var(${string})`;
          }
        >
      >();
    });

    test("infers type for a single token via InferCSSSyntax", () => {
      assertType<
        Equal<
          InferCSSSyntax<
            SupportedKeywords,
            { "<length>": ["`${number}${'px'}`"] },
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
            { "<length>": ["`${number}${'px'}`"] },
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
        "<length>": ["`${number}${'px' | 'rem'}`"],
      });
      assert.deepStrictEqual(config, {
        "<length>": "`${number}${'px' | 'rem'}`",
      });
    });

    test("joins a multi-arm token with ' | '", () => {
      const config = cssSyntaxConfig(SUPPORTED_KEYWORDS, {
        "<length>": ["`${number}${'px'}`", "<calc>", "<var>"],
        "<calc>": ["`calc(${string})`"],
        "<var>": ["`var(${string})`"],
      });
      assert.deepStrictEqual(config, {
        "<length>": "`${number}${'px'}` | <calc> | <var>",
        "<calc>": "`calc(${string})`",
        "<var>": "`var(${string})`",
      });
    });

    test("accepts multiple syntax tokens", () => {
      const config = cssSyntaxConfig(SUPPORTED_KEYWORDS, {
        "<integer>": ["`${bigint}`"],
        "<number>": ["`${number}`"],
      });
      assert.deepStrictEqual(config, {
        "<integer>": "`${bigint}`",
        "<number>": "`${number}`",
      });
    });

    test("accepts token references (recursive keyword resolution)", () => {
      const config = cssSyntaxConfig(SUPPORTED_KEYWORDS, {
        "<length>": ["`${number}${'px' | 'rem'}`"],
        "<percentage>": ["`${number}%`"],
        "<length-percentage>": ["<length>", "<percentage>"],
      });
      assert.deepStrictEqual(config, {
        "<length>": "`${number}${'px' | 'rem'}`",
        "<percentage>": "`${number}%`",
        "<length-percentage>": "<length> | <percentage>",
      });
    });

    test("accepts chained token references", () => {
      const config = cssSyntaxConfig(SUPPORTED_KEYWORDS, {
        "<length>": ["`${number}${'px'}`"],
        "<percentage>": ["`${number}%`"],
        "<length-percentage>": ["<length>", "<percentage>"],
        "<track-breadth>": ["<length-percentage>", "'auto'", "'min-content'"],
      });
      assert.deepStrictEqual(config, {
        "<length>": "`${number}${'px'}`",
        "<percentage>": "`${number}%`",
        "<length-percentage>": "<length> | <percentage>",
        "<track-breadth>": "<length-percentage> | 'auto' | 'min-content'",
      });
    });

    test("returns joined strings, not the input arrays", () => {
      const input = {
        "<length>": ["`${number}${'px'}`"],
      } as const;
      const config = cssSyntaxConfig(SUPPORTED_KEYWORDS, input);
      assert.deepStrictEqual(config, { "<length>": "`${number}${'px'}`" });
      assert.notStrictEqual(config, input);
    });
  });

  describe("Error handling", () => {
    test("throws for key not wrapped in <>", () => {
      assert.throws(
        () =>
          cssSyntaxConfig(SUPPORTED_KEYWORDS, {
            // @ts-expect-error
            length: ["`${number}${'px'}`"],
          }),
        /should start and end with/,
      );
    });

    test("throws for an empty arm list", () => {
      assert.throws(
        () =>
          cssSyntaxConfig(SUPPORTED_KEYWORDS, {
            // @ts-expect-error an empty arm list is rejected
            "<length>": [],
          }),
        /at least one arm/,
      );
    });

    test("throws for invalid DSL string in value", () => {
      assert.throws(
        () =>
          cssSyntaxConfig(SUPPORTED_KEYWORDS, {
            // @ts-expect-error
            "<length>": ["xyz"],
          }),
        /Invalid DSL string/,
      );
    });

    test("throws for unknown token reference", () => {
      assert.throws(
        () =>
          cssSyntaxConfig(SUPPORTED_KEYWORDS, {
            // @ts-expect-error
            "<length>": ["<unknown-token>"],
          }),
        /Invalid DSL string/,
      );
    });

    test("throws when one arm references an unknown token", () => {
      assert.throws(
        () =>
          cssSyntaxConfig(SUPPORTED_KEYWORDS, {
            // @ts-expect-error
            "<length>": ["`${number}${'px'}`", "<unknown-token>"],
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
            "<a>": ["<a>"],
          }),
        /Circular reference/,
      );
    });

    test("throws for indirect circular reference (a -> b -> a)", () => {
      assert.throws(
        () =>
          cssSyntaxConfig(SUPPORTED_KEYWORDS, {
            "<a>": ["<b>"],
            "<b>": ["<a>"],
          }),
        /Circular reference/,
      );
    });

    test("throws for longer cycle (a -> b -> c -> a)", () => {
      assert.throws(
        () =>
          cssSyntaxConfig(SUPPORTED_KEYWORDS, {
            "<a>": ["<b>"],
            "<b>": ["<c>"],
            "<c>": ["<a>"],
          }),
        /Circular reference/,
      );
    });

    test("throws for self-reference in union", () => {
      assert.throws(
        () =>
          cssSyntaxConfig(SUPPORTED_KEYWORDS, {
            "<length>": ["`${number}${'px'}`"],
            "<length-percentage>": ["<length>", "<length-percentage>"],
          }),
        /Circular reference/,
      );
    });

    test("throws for cross-cycle in union (a -> b | c, b -> a)", () => {
      assert.throws(
        () =>
          cssSyntaxConfig(SUPPORTED_KEYWORDS, {
            "<a>": ["<b>", "<c>"],
            "<b>": ["<a>"],
            "<c>": ["`${number}%`"],
          }),
        /Circular reference/,
      );
    });

    test("accepts acyclic references", () => {
      const config = cssSyntaxConfig(SUPPORTED_KEYWORDS, {
        "<length>": ["`${number}${'px'}`"],
        "<percentage>": ["`${number}%`"],
        "<length-percentage>": ["<length>", "<percentage>"],
      });
      assert.ok(config);
    });
  });

  describe("Percentage-family types", () => {
    test("common defines the named percentage-family types", () => {
      for (const name of [
        "<length-percentage>",
        "<angle-percentage>",
        "<time-percentage>",
        "<frequency-percentage>",
      ]) {
        assert.ok(name in COMMON_SYNTAX, `${name} should be defined`);
      }
    });

    test("full defines the named percentage-family types", () => {
      for (const name of [
        "<length-percentage>",
        "<angle-percentage>",
        "<time-percentage>",
        "<frequency-percentage>",
      ]) {
        assert.ok(name in FULL_SYNTAX, `${name} should be defined`);
      }
    });

    test("minimal defines the percentage-family types whose bases it ships", () => {
      for (const name of ["<length-percentage>", "<time-percentage>"]) {
        assert.ok(name in MINIMAL_SYNTAX, `${name} should be defined`);
      }
    });
  });

  describe("Edge Cases", () => {
    test("empty config is accepted", () => {
      const config = cssSyntaxConfig(SUPPORTED_KEYWORDS, {});
      assert.deepStrictEqual(config, {});
    });

    test("config with only keyword references passes", () => {
      const config = cssSyntaxConfig(SUPPORTED_KEYWORDS, {
        "<length>": ["`${number}${'px'}`"],
        "<length-percentage>": ["<length>", "<percentage>"],
        "<percentage>": ["`${number}%`"],
      });
      assert.ok(config);
    });

    test("template literal with no interpolations is accepted", () => {
      const config = cssSyntaxConfig(SUPPORTED_KEYWORDS, {
        "<custom>": ["`plain`"],
      });
      assert.deepStrictEqual(config, { "<custom>": "`plain`" });
    });

    test("single-character key inside <> is accepted", () => {
      const config = cssSyntaxConfig(SUPPORTED_KEYWORDS, {
        "<x>": ["`${number}`"],
      });
      assert.deepStrictEqual(config, { "<x>": "`${number}`" });
    });
  });

  // -------------------------------------------------------------------------
  // Legacy comma-separated colour forms.
  //
  // `<color>` is a closed union of concrete template-literal arms, so a
  // function form is accepted only if an arm spells it. Each tier declares the
  // comma arms for exactly the functions it already declares; the interior
  // stays scalar so the type wall and the runtime wall share one grammar.
  // -------------------------------------------------------------------------
  describe("Legacy comma-separated colour forms", () => {
    type ColorOf<Tier extends CSSSyntaxKeywords> = InferCSSSyntax<
      SupportedKeywords,
      Tier,
      "<color>"
    >;
    type AcceptsColor<Tier extends CSSSyntaxKeywords, V extends string> =
      V extends ColorOf<Tier> ? true : false;

    // The runtime wall the engine runs: the merged keyword map is the config
    // under test, and the value is matched against that token's DSL string.
    const RUNTIME_MINIMAL = { ...SUPPORTED_KEYWORDS, ...MINIMAL_SYNTAX };
    const RUNTIME_COMMON = { ...SUPPORTED_KEYWORDS, ...COMMON_SYNTAX };
    const RUNTIME_FULL = { ...SUPPORTED_KEYWORDS, ...FULL_SYNTAX };

    describe("minimal", () => {
      test("type-level: accepts the comma rgb form and rejects hsl", () => {
        assertType<
          Equal<AcceptsColor<typeof MINIMAL_SYNTAX, "rgb(255, 0, 0)">, true>
        >();
        // The space-separated arm is untouched.
        assertType<
          Equal<AcceptsColor<typeof MINIMAL_SYNTAX, "rgb(255 0 0)">, true>
        >();
        // hsl is not declared in minimal, comma or otherwise.
        assertType<
          Equal<
            AcceptsColor<typeof MINIMAL_SYNTAX, "hsl(0, 100%, 50%)">,
            false
          >
        >();
        // Malformed arity is still a type error.
        assertType<
          Equal<AcceptsColor<typeof MINIMAL_SYNTAX, "rgb(255, 0)">, false>
        >();
      });

      test("runtime: accepts the comma rgb form and rejects hsl", () => {
        assert.doesNotThrow(() =>
          parseValueAgainstDSL(
            RUNTIME_MINIMAL,
            MINIMAL_SYNTAX["<color>"],
            "rgb(255, 0, 0)",
          ),
        );
        assert.doesNotThrow(() =>
          parseValueAgainstDSL(
            RUNTIME_MINIMAL,
            MINIMAL_SYNTAX["<color>"],
            "rgb(255 0 0)",
          ),
        );
        assert.throws(
          () =>
            parseValueAgainstDSL(
              RUNTIME_MINIMAL,
              MINIMAL_SYNTAX["<color>"],
              "hsl(0, 100%, 50%)" as never,
            ),
          /does not match DSL/,
        );
        assert.throws(
          () =>
            parseValueAgainstDSL(
              RUNTIME_MINIMAL,
              MINIMAL_SYNTAX["<color>"],
              "rgb(255, 0)" as never,
            ),
          /does not match DSL/,
        );
      });
    });

    describe("common", () => {
      test("type-level: accepts every added comma form and the space forms", () => {
        for (const form of [
          "rgb(255, 0, 0)",
          "rgba(255, 0, 0, 0.5)",
          "hsl(0, 100%, 50%)",
          "hsla(0, 100%, 50%, 0.5)",
        ] as const) {
          assertType<Equal<AcceptsColor<typeof COMMON_SYNTAX, typeof form>, true>>();
        }
        assertType<
          Equal<AcceptsColor<typeof COMMON_SYNTAX, "rgb(255 0 0)">, true>
        >();
        assertType<
          Equal<AcceptsColor<typeof COMMON_SYNTAX, "hsl(0 100% 50%)">, true>
        >();
        assertType<
          Equal<AcceptsColor<typeof COMMON_SYNTAX, "rgb(255, 0)">, false>
        >();
      });

      test("runtime: accepts every added comma form and rejects malformed", () => {
        for (const form of [
          "rgb(255, 0, 0)",
          "rgba(255, 0, 0, 0.5)",
          "hsl(0, 100%, 50%)",
          "hsla(0, 100%, 50%, 0.5)",
          "rgb(255 0 0)",
          "hsl(0 100% 50%)",
        ]) {
          assert.doesNotThrow(
            () =>
              parseValueAgainstDSL(
                RUNTIME_COMMON,
                COMMON_SYNTAX["<color>"],
                form as never,
              ),
            `${form} should be accepted`,
          );
        }
        assert.throws(
          () =>
            parseValueAgainstDSL(
              RUNTIME_COMMON,
              COMMON_SYNTAX["<color>"],
              "rgb(255, 0)" as never,
            ),
          /does not match DSL/,
        );
      });
    });

    describe("full", () => {
      test("type-level: accepts the added comma forms and the space forms", () => {
        assertType<
          Equal<AcceptsColor<typeof FULL_SYNTAX, "rgb(255, 0, 0)">, true>
        >();
        assertType<
          Equal<AcceptsColor<typeof FULL_SYNTAX, "hsl(0, 100%, 50%)">, true>
        >();
        assertType<
          Equal<AcceptsColor<typeof FULL_SYNTAX, "rgba(255, 0, 0, 0.5)">, true>
        >();
        assertType<
          Equal<AcceptsColor<typeof FULL_SYNTAX, "hsla(0, 100%, 50%, 0.5)">, true>
        >();
        assertType<
          Equal<AcceptsColor<typeof FULL_SYNTAX, "rgb(255 0 0)">, true>
        >();
      });

      test("runtime: accepts the added comma forms and rejects malformed", () => {
        for (const form of [
          "rgb(255, 0, 0)",
          "hsl(0, 100%, 50%)",
          "rgba(255, 0, 0, 0.5)",
          "hsla(0, 100%, 50%, 0.5)",
          "rgb(255 0 0)",
        ]) {
          assert.doesNotThrow(
            () =>
              parseValueAgainstDSL(
                RUNTIME_FULL,
                FULL_SYNTAX["<color>"],
                form as never,
              ),
            `${form} should be accepted`,
          );
        }
        assert.throws(
          () =>
            parseValueAgainstDSL(
              RUNTIME_FULL,
              FULL_SYNTAX["<color>"],
              "rgb(255, 0)" as never,
            ),
          /does not match DSL/,
        );
      });
    });

    test("config builder accepts the comma arms at runtime", () => {
      const config = cssSyntaxConfig(SUPPORTED_KEYWORDS, {
        "<number>": ["`${number}`", "<calc>", "<var>"],
        "<calc>": ["`calc(${string})`"],
        "<var>": ["`var(${string})`"],
        "<color>": [
          "`rgb(${number}, ${number}, ${number})`",
          "`rgba(${number}, ${number}, ${number}, ${number})`",
          "`hsl(${number}, ${number}%, ${number}%)`",
          "`hsla(${number}, ${number}%, ${number}%, ${number})`",
        ],
      });
      assert.ok(config["<color>"]);
    });
  });
});
