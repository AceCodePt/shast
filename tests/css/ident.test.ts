import test, { describe } from "node:test";
import assert from "node:assert";
import {
  ALLOWED_IDENTIFIER_CHARS,
  ALLOWED_IDENTIFIER_DIGITS,
  CSS_IDENTIFIER_REGEX,
  type CSSIdentifierCharacter,
  type CSSIdentifierDigit,
  type CharsOf,
} from "@/css/ident.ts";
import { QUERY_VOCABULARY, type QueryVocabulary } from "@/css/queries-config/types.ts";
import {
  KEYFRAME_SELECTOR_ALIASES,
  type NormalizeSelector,
} from "@/css/keyframes-config/types.ts";
import { assertType, type Equal } from "../type-utils.ts";

describe("css identifier consolidation", () => {
  test("CSSIdentifierCharacter is exactly CharsOf of the data", () => {
    assertType<
      Equal<CSSIdentifierCharacter, CharsOf<typeof ALLOWED_IDENTIFIER_CHARS>>
    >();
  });

  test("CSSIdentifierDigit is exactly CharsOf of the data", () => {
    assertType<
      Equal<CSSIdentifierDigit, CharsOf<typeof ALLOWED_IDENTIFIER_DIGITS>>
    >();
  });

  test("QueryVocabulary is exactly typeof QUERY_VOCABULARY", () => {
    assertType<Equal<QueryVocabulary, typeof QUERY_VOCABULARY>>();
  });

  test("normalizeSelector aliases come from the alias map data", () => {
    assertType<Equal<NormalizeSelector<"from">, "0%">>();
    assertType<Equal<NormalizeSelector<"to">, "100%">>();
    assertType<Equal<NormalizeSelector<"50%">, "50%">>();
    assert.deepStrictEqual(KEYFRAME_SELECTOR_ALIASES, {
      from: "0%",
      to: "100%",
    });
  });

  test("runtime identifier regex keeps the non-ASCII allowance", () => {
    assert.equal(CSS_IDENTIFIER_REGEX.test("fade"), true);
    assert.equal(CSS_IDENTIFIER_REGEX.test("-bounce"), true);
    assert.equal(CSS_IDENTIFIER_REGEX.test("日本語"), true);
    assert.equal(CSS_IDENTIFIER_REGEX.test("fade out"), false);
    assert.equal(CSS_IDENTIFIER_REGEX.test("123fade"), false);
    assert.equal(CSS_IDENTIFIER_REGEX.test("--fade"), false);
  });
});