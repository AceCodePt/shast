// Data-first CSS identifier vocabulary.
//
// The identifier character set is DATA (the const strings below), and every
// type-level union and the runtime check are derived from that same data so
// the two walls cannot drift. The non-ASCII allowance (\u00A0-\uFFFF) is
// appended at runtime only and deliberately absent from the type-level union,
// exactly as before: this is a consolidation, not a tightening.

export const ALLOWED_IDENTIFIER_CHARS =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-" as const;

export const ALLOWED_IDENTIFIER_START =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_" as const;

export const ALLOWED_IDENTIFIER_DIGITS = "0123456789" as const;

// Splits a string into a union of its characters. Consumes four characters per
// recursion level so the 63-char vocabulary stays well under the instantiation
// depth limit.
export type CharsOf<S extends string> =
  S extends `${infer C1}${infer C2}${infer C3}${infer C4}${infer Rest}`
    ? C1 | C2 | C3 | C4 | CharsOf<Rest>
    : S extends `${infer C1}${infer C2}${infer C3}${infer C4}`
      ? C1 | C2 | C3 | C4
      : S extends `${infer C1}${infer C2}${infer C3}`
        ? C1 | C2 | C3
        : S extends `${infer C1}${infer C2}`
          ? C1 | C2
          : S extends `${infer C1}`
            ? C1
            : never;

export type CSSIdentifierCharacter = CharsOf<typeof ALLOWED_IDENTIFIER_CHARS>;
export type CSSIdentifierDigit = CharsOf<typeof ALLOWED_IDENTIFIER_DIGITS>;

// Whether `S` contains any character not in `Allowed`.
export type ContainsIllegalCharacter<
  S extends string,
  Allowed extends string,
> = S extends `${infer Head}${infer Tail}`
  ? Head extends Allowed
    ? ContainsIllegalCharacter<Tail, Allowed>
    : true
  : false;

// Runtime check built from the same data the type union derives from: an
// optional leading hyphen, then a start character, then any allowed character
// (plus the non-ASCII range).
const NON_ASCII_RANGE = "\\u00A0-\\uFFFF";
const escapeClassChar = (chars: string): string =>
  chars.replace(/[-\\\]^]/g, "\\$&");

export const CSS_IDENTIFIER_REGEX = new RegExp(
  `^-?[${escapeClassChar(ALLOWED_IDENTIFIER_START)}${NON_ASCII_RANGE}][${escapeClassChar(ALLOWED_IDENTIFIER_CHARS)}${NON_ASCII_RANGE}]*$`,
);