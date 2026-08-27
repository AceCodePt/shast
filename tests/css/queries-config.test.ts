import test, { describe } from "node:test";
import assert from "node:assert";
import { cssQueriesConfig } from "@/css/queries-config/index.ts";
import { uniqueArray } from "@/types.ts";
import {
  type QueryVocabularyFor,
  type ValidateQueries as RawValidateQueries,
  type ValidateQuery as RawValidateQuery,
} from "@/css/queries-config/types.ts";
import type { BaseCSSSyntaxConfig } from "@/css/syntax-config/types.ts";

type ValidateQuery<S extends string> = RawValidateQuery<
  S,
  QueryVocabularyFor<typeof COMMON_SYNTAX>
>;
type ValidateQueries<T extends readonly string[]> = RawValidateQueries<
  T,
  QueryVocabularyFor<typeof COMMON_SYNTAX>
>;
import MINIMAL_QUERIES from "@/css/queries-config/variations/minimal.ts";
import COMMON_QUERIES from "@/css/queries-config/variations/common.ts";
import FULL_QUERIES from "@/css/queries-config/variations/full.ts";
import MINIMAL_SYNTAX from "@/css/syntax-config/variations/minimal.ts";
import COMMON_SYNTAX from "@/css/syntax-config/variations/common.ts";
import FULL_SYNTAX from "@/css/syntax-config/variations/full.ts";
import { assertType, type Equal } from "../type-utils.ts";

describe("cssQueriesConfig", () => {
  describe("Type Validation", () => {
    test("accepts a media width comparison query", () => {
      assertType<
        Equal<ValidateQuery<"@media (width < 768px)">, "@media (width < 768px)">
      >();
    });

    test("accepts a two-sided width range", () => {
      assertType<
        Equal<
          ValidateQuery<"@media (768px <= width < 1024px)">,
          "@media (768px <= width < 1024px)"
        >
      >();
    });

    test("accepts a media type with conditions", () => {
      assertType<
        Equal<
          ValidateQuery<"@media screen and (width < 768px)">,
          "@media screen and (width < 768px)"
        >
      >();
    });

    test("accepts a not media type query", () => {
      assertType<
        Equal<ValidateQuery<"@media not print">, "@media not print">
      >();
    });

    test("accepts only media type query", () => {
      assertType<
        Equal<
          ValidateQuery<"@media only screen and (width >= 1024px)">,
          "@media only screen and (width >= 1024px)"
        >
      >();
    });

    test("accepts a comma-separated media query list", () => {
      assertType<
        Equal<
          ValidateQuery<"@media (width < 768px), (orientation: portrait)">,
          "@media (width < 768px), (orientation: portrait)"
        >
      >();
    });

    test("accepts a named container query", () => {
      assertType<
        Equal<
          ValidateQuery<"@container sidebar (min-width: 600px)">,
          "@container sidebar (min-width: 600px)"
        >
      >();
    });

    test("accepts a container style query", () => {
      assertType<
        Equal<
          ValidateQuery<"@container style(--theme: dark)">,
          "@container style(--theme: dark)"
        >
      >();
    });

    test("rejects a query missing the @ prefix", () => {
      assertType<
        Equal<
          ValidateQuery<"media (width < 768px)">,
          "Query must start with @media or @container"
        >
      >();
    });

    test("rejects an unknown media feature", () => {
      assertType<
        Equal<
          ValidateQuery<"@media (frobnicate: 3)">,
          "Invalid media feature: (frobnicate: 3)"
        >
      >();
    });

    test("rejects an unclosed parenthesis", () => {
      assertType<
        Equal<
          ValidateQuery<"@media (width < 768px">,
          "Invalid media feature: (width < 768px"
        >
      >();
    });

    test("rejects a bad comparison operator", () => {
      assertType<
        Equal<
          ValidateQuery<"@media (width == 768px)">,
          "Invalid media feature: (width == 768px)"
        >
      >();
    });
  });

  describe("Type Inference", () => {
    test("infers the exact literal tuple of passed query strings", () => {
      const queries = cssQueriesConfig(COMMON_SYNTAX, [
        "@media (width < 768px)",
        "@media (resolution >= 2dppx)",
        "@container (width > 400px)",
      ]);
      assertType<
        Equal<
          typeof queries,
          readonly [
            "@media (width < 768px)",
            "@media (resolution >= 2dppx)",
            "@container (width > 400px)",
          ]
        >
      >();
    });
  });

  describe("Runtime Validation", () => {
    test("accepts media width/height comparison operators", () => {
      const config = cssQueriesConfig(COMMON_SYNTAX, [
        "@media (width < 768px)",
        "@media (width >= 1024px)",
        "@media (768px <= width < 1024px)",
        "@media (height <= 600px)",
      ]);
      assert.equal(config.length, 4);
    });

    test("accepts media feature-value queries", () => {
      const config = cssQueriesConfig(COMMON_SYNTAX, [
        "@media (prefers-color-scheme: dark)",
        "@media (prefers-reduced-motion: reduce)",
        "@media (orientation: landscape)",
        "@media (resolution >= 2dppx)",
        "@media (min-device-pixel-ratio: 2)",
      ]);
      assert.equal(config.length, 5);
    });

    test("accepts compound media queries", () => {
      const config = cssQueriesConfig(COMMON_SYNTAX, [
        "@media (width < 768px) and (prefers-color-scheme: dark)",
        "@media (width < 768px), (orientation: portrait)",
        "@media screen and (width < 768px)",
        "@media only screen and (width >= 1024px)",
        "@media not print",
      ]);
      assert.equal(config.length, 5);
    });

    test("accepts container queries", () => {
      const config = cssQueriesConfig(COMMON_SYNTAX, [
        "@container (width > 400px)",
        "@container sidebar (min-width: 600px)",
        "@container (width > 400px) and (height > 200px)",
        "@container style(--theme: dark)",
      ]);
      assert.equal(config.length, 4);
    });

    test("returns the array and preserves the reference", () => {
      const input = [
        "@media (width < 768px)",
        "@container (width > 400px)",
      ] as const;
      const config = cssQueriesConfig(COMMON_SYNTAX, input);
      assert.strictEqual(config, input);
      assert.deepStrictEqual(config, input);
    });

    test("throws for unknown media feature", () => {
      assert.throws(
        () => {
          // @ts-expect-error unknown media feature is a type-level error
          return cssQueriesConfig(COMMON_SYNTAX, ["@media (frobnicate: 3)"]);
        },
        /Unknown or invalid media feature/,
      );
    });

    test("throws for query missing the @ prefix", () => {
      assert.throws(
        () => {
          // @ts-expect-error missing @ prefix is a type-level error
          return cssQueriesConfig(COMMON_SYNTAX, ["media (width < 768px)"]);
        },
        /must start with/,
      );
    });

    test("throws for unclosed parenthesis", () => {
      assert.throws(
        () => {
          // @ts-expect-error unclosed paren is a type-level error
          return cssQueriesConfig(COMMON_SYNTAX, ["@media (width < 768px"]);
        },
        /Unclosed parenthesis/,
      );
    });

    test("throws for bad comparison operator", () => {
      assert.throws(
        () => {
          // @ts-expect-error bad operator is a type-level error
          return cssQueriesConfig(COMMON_SYNTAX, ["@media (width == 768px)"]);
        },
        /Invalid comparison/,
      );
    });

    test("throws for invalid media feature value", () => {
      assert.throws(
        () => {
          // @ts-expect-error invalid value is a type-level error
          return cssQueriesConfig(COMMON_SYNTAX, ["@media (prefers-color-scheme: yellow)"]);
        },
        /Unknown or invalid media feature/,
      );
    });

    test("throws for unknown container feature", () => {
      assert.throws(
        () => {
          // @ts-expect-error unknown container feature is a type-level error
          return cssQueriesConfig(COMMON_SYNTAX, ["@container (frobnicate: 3)"]);
        },
        /Unknown or invalid container feature/,
      );
    });
  });

  describe("Edge Cases", () => {
    test("empty array is accepted", () => {
      const config = cssQueriesConfig(COMMON_SYNTAX, []);
      assert.deepStrictEqual(config, []);
    });

    test("query with only a media type is accepted", () => {
      const config = cssQueriesConfig(COMMON_SYNTAX, ["@media all"]);
      assert.equal(config.length, 1);
    });

    test("query must start with @media or @container", () => {
      assert.throws(
        () => {
          // @ts-expect-error unknown @ prefix is a type-level error
          return cssQueriesConfig(COMMON_SYNTAX, ["@phone (width < 768px)"]);
        },
        /must start with/,
      );
    });
  });

  describe("Variations", () => {
    test("Minimal variation builds without error", () => {
      assert.equal(Array.isArray(MINIMAL_QUERIES), true);
      assert.equal(MINIMAL_QUERIES.length, 6);
    });

    test("Common variation builds without error", () => {
      assert.equal(Array.isArray(COMMON_QUERIES), true);
      assert.equal(COMMON_QUERIES.length, 13);
    });

    test("Full variation builds without error", () => {
      assert.equal(Array.isArray(FULL_QUERIES), true);
      assert.equal(FULL_QUERIES.length, 27);
    });
  });

  describe("Type Validation of Variations (integration)", () => {
    test("ValidateQueries maps every variation entry to itself", () => {
      const minimal = [
        "@media (width < 480px)",
        "@media (width < 768px)",
        "@media (width >= 768px)",
        "@media (width < 1024px)",
        "@media (width >= 1024px)",
        "@media (prefers-reduced-motion: reduce)",
      ] as const;
      assertType<Equal<ValidateQueries<typeof minimal>, typeof minimal>>();
    });
  });

  describe("DSL-Derived Unit Vocabulary", () => {
    test('"768px" extends the common length units derived from the DSL', () => {
      type LengthUnits =
        QueryVocabularyFor<typeof COMMON_SYNTAX>["lengthUnits"];
      assertType<"768px" extends LengthUnits ? true : false>();
    });

    test('"1cqw" does not extend the common length units', () => {
      type LengthUnits =
        QueryVocabularyFor<typeof COMMON_SYNTAX>["lengthUnits"];
      assertType<Equal<"1cqw" extends LengthUnits ? true : false, false>>();
    });

    test('"2dppx" extends the common resolution units', () => {
      type ResolutionUnits =
        QueryVocabularyFor<typeof COMMON_SYNTAX>["resolutionUnits"];
      assertType<"2dppx" extends ResolutionUnits ? true : false>();
    });

    test('"2dppx" does not extend minimal resolution units (no <resolution>)', () => {
      type ResolutionUnits =
        QueryVocabularyFor<typeof MINIMAL_SYNTAX>["resolutionUnits"];
      assertType<Equal<"2dppx" extends ResolutionUnits ? true : false, false>>();
    });

    test("resolution queries are a type error and throw without <resolution>", () => {
      assert.throws(
        () => {
          // @ts-expect-error minimal syntax has no <resolution> token
          return cssQueriesConfig(MINIMAL_SYNTAX, ["@media (resolution >= 2dppx)"]);
        },
        /Invalid comparison/,
      );
    });

    test("@media (width < 1cqw) passes with full syntax but throws with common", () => {
      const full = cssQueriesConfig(FULL_SYNTAX, ["@media (width < 1cqw)"]);
      assert.deepStrictEqual(full, ["@media (width < 1cqw)"]);
      assert.throws(
        () => {
          // @ts-expect-error common syntax has no cqw unit
          return cssQueriesConfig(COMMON_SYNTAX, ["@media (width < 1cqw)"]);
        },
        /Invalid comparison/,
      );
    });

    test("throws a clear error when the config lacks a <length> token", () => {
      assert.throws(
        () =>
          cssQueriesConfig(
            { "<number>": "`${number}`" } as unknown as BaseCSSSyntaxConfig,
            [],
          ),
        /"<length>" token/,
      );
    });
  });

  describe("uniqueArray vocabulary", () => {
    test("infers the literal tuple from the array", () => {
      const arr = uniqueArray(["all", "screen", "print"]);
      assertType<Equal<typeof arr, readonly ["all", "screen", "print"]>>();
    });

    test("rejects duplicates as a type-level error", () => {
      function rejectDuplicates(): void {
        // @ts-expect-error duplicate items are a type-level error
        uniqueArray(["a", "a"]);
      }
      assert.equal(typeof rejectDuplicates, "function");
    });

    test("preserves the reference", () => {
      const input = ["<", "<=", ">", ">="] as const;
      assert.strictEqual(uniqueArray(input), input);
    });

    test("throws at runtime for duplicates passed via cast", () => {
      assert.throws(
        () => uniqueArray(["a", "a"] as string[]),
        /Duplicate item/,
      );
    });
  });
});