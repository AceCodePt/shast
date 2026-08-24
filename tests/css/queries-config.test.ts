import test, { describe } from "node:test";
import assert from "node:assert";
import { cssQueriesConfig } from "@/css/queries-config/index.ts";
import type { ValidateQueries, ValidateQuery } from "@/css/queries-config/types.ts";
import MINIMAL_QUERIES from "@/css/queries-config/variations/minimal.ts";
import COMMON_QUERIES from "@/css/queries-config/variations/common.ts";
import FULL_QUERIES from "@/css/queries-config/variations/full.ts";
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
    test("infers the exact literal union of passed query strings", () => {
      const queries = cssQueriesConfig([
        "@media (width < 768px)",
        "@container (width > 400px)",
      ] as const);
      assertType<
        Equal<
          typeof queries,
          readonly [
            "@media (width < 768px)",
            "@container (width > 400px)",
          ]
        >
      >();
    });
  });

  describe("Runtime Validation", () => {
    test("accepts media width/height comparison operators", () => {
      const config = cssQueriesConfig([
        "@media (width < 768px)",
        "@media (width >= 1024px)",
        "@media (768px <= width < 1024px)",
        "@media (height <= 600px)",
      ] as const);
      assert.equal(config.length, 4);
    });

    test("accepts media feature-value queries", () => {
      const config = cssQueriesConfig([
        "@media (prefers-color-scheme: dark)",
        "@media (prefers-reduced-motion: reduce)",
        "@media (orientation: landscape)",
        "@media (resolution >= 2dppx)",
        "@media (min-device-pixel-ratio: 2)",
      ] as const);
      assert.equal(config.length, 5);
    });

    test("accepts compound media queries", () => {
      const config = cssQueriesConfig([
        "@media (width < 768px) and (prefers-color-scheme: dark)",
        "@media (width < 768px), (orientation: portrait)",
        "@media screen and (width < 768px)",
        "@media only screen and (width >= 1024px)",
        "@media not print",
      ] as const);
      assert.equal(config.length, 5);
    });

    test("accepts container queries", () => {
      const config = cssQueriesConfig([
        "@container (width > 400px)",
        "@container sidebar (min-width: 600px)",
        "@container (width > 400px) and (height > 200px)",
        "@container style(--theme: dark)",
      ] as const);
      assert.equal(config.length, 4);
    });

    test("returns the array and preserves the reference", () => {
      const input = [
        "@media (width < 768px)",
        "@container (width > 400px)",
      ] as const;
      const config = cssQueriesConfig(input);
      assert.strictEqual(config, input);
      assert.deepStrictEqual(config, input);
    });

    test("throws for unknown media feature", () => {
      assert.throws(
        () => {
          // @ts-expect-error unknown media feature is a type-level error
          return cssQueriesConfig(["@media (frobnicate: 3)"] as const);
        },
        /Unknown or invalid media feature/,
      );
    });

    test("throws for query missing the @ prefix", () => {
      assert.throws(
        () => {
          // @ts-expect-error missing @ prefix is a type-level error
          return cssQueriesConfig(["media (width < 768px)"] as const);
        },
        /must start with/,
      );
    });

    test("throws for unclosed parenthesis", () => {
      assert.throws(
        () => {
          // @ts-expect-error unclosed paren is a type-level error
          return cssQueriesConfig(["@media (width < 768px"] as const);
        },
        /Unclosed parenthesis/,
      );
    });

    test("throws for bad comparison operator", () => {
      assert.throws(
        () => {
          // @ts-expect-error bad operator is a type-level error
          return cssQueriesConfig(["@media (width == 768px)"] as const);
        },
        /Invalid comparison/,
      );
    });

    test("throws for invalid media feature value", () => {
      assert.throws(
        () => {
          // @ts-expect-error invalid value is a type-level error
          return cssQueriesConfig(["@media (prefers-color-scheme: yellow)"] as const);
        },
        /Unknown or invalid media feature/,
      );
    });

    test("throws for unknown container feature", () => {
      assert.throws(
        () => {
          // @ts-expect-error unknown container feature is a type-level error
          return cssQueriesConfig(["@container (frobnicate: 3)"] as const);
        },
        /Unknown or invalid container feature/,
      );
    });
  });

  describe("Edge Cases", () => {
    test("empty array is accepted", () => {
      const config = cssQueriesConfig([] as const);
      assert.deepStrictEqual(config, []);
    });

    test("query with only a media type is accepted", () => {
      const config = cssQueriesConfig(["@media all"] as const);
      assert.equal(config.length, 1);
    });

    test("query must start with @media or @container", () => {
      assert.throws(
        () => {
          // @ts-expect-error unknown @ prefix is a type-level error
          return cssQueriesConfig(["@phone (width < 768px)"] as const);
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
});