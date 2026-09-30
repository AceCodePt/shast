import test, { describe } from "node:test";
import assert from "node:assert";
import { SUPPORTED_KEYWORDS } from "tsyntax";
import { resolveGateValue } from "@/engine/gate-resolution.ts";

// `resolveGateValue` is the shared gate machinery behind both walls. A written
// value resolves to the declared key that matched: a literal key wins outright
// over any pattern that also matches it, in either declaration order, and
// pattern keys are only tried on a literal miss. These tests pin that
// precedence, the pattern-against-pattern ambiguity error, and that prototype
// names are not resolved up the chain.

const bag = { self: {}, children: {} };

describe("resolveGateValue", () => {
  describe("literal over pattern precedence", () => {
    test("a literal declared before a matching pattern wins", () => {
      const definition = {
        "todo-1": bag,
        "`todo-${number}`": bag,
      };
      assert.strictEqual(
        resolveGateValue(
          SUPPORTED_KEYWORDS,
          "id",
          definition,
          "todo-1",
          "Attribute",
        ),
        "todo-1",
      );
    });

    test("a literal declared after a matching pattern wins", () => {
      const definition = {
        "`todo-${number}`": bag,
        "todo-1": bag,
      };
      assert.strictEqual(
        resolveGateValue(
          SUPPORTED_KEYWORDS,
          "id",
          definition,
          "todo-1",
          "Attribute",
        ),
        "todo-1",
      );
    });

    test("a value matching only the pattern still resolves to it", () => {
      const definition = {
        "`todo-${number}`": bag,
        "todo-1": bag,
      };
      assert.strictEqual(
        resolveGateValue(
          SUPPORTED_KEYWORDS,
          "id",
          definition,
          "todo-7",
          "Attribute",
        ),
        "`todo-${number}`",
      );
    });
  });

  describe("pattern ambiguity", () => {
    test("a value matching two pattern keys is an error", () => {
      const definition = {
        "`todo-${string}`": bag,
        "`todo-${number}`": bag,
      };
      assert.throws(
        () =>
          resolveGateValue(
            SUPPORTED_KEYWORDS,
            "id",
            definition,
            "todo-42",
            "Attribute",
          ),
        /matches more than one pattern key/,
      );
    });
  });

  describe("prototype names", () => {
    test("a written `constructor` is rejected, not resolved up the prototype chain", () => {
      const definition = {
        block: bag,
        "`x-${number}`": bag,
      };
      assert.throws(
        () =>
          resolveGateValue(
            SUPPORTED_KEYWORDS,
            "display",
            definition,
            "constructor",
            "CSS",
          ),
        /Expected one of/,
      );
    });
  });
});
