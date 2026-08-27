// ---------------------------------------------------------------------------
// Data-first CSS identifier vocabulary.
//
// The ASCII identifier characters are the single source of truth for the
// identifier walls: the type-level unions are DERIVED from the data strings
// (CharsOf string-split), and the runtime regex is BUILT from the same data,
// so the two walls cannot drift.
//
// The type-level character set is ASCII-only. The runtime additionally accepts
// the non-ASCII \u00A0-\uFFFF range (matching real CSS custom-ident parsing);
// that range is a character RANGE, not a finite set, so it lives separately as
// a regex fragment rather than as a CharsOf element. This is a consolidation,
// not a tightening: runtime acceptance is unchanged.
// ---------------------------------------------------------------------------

// Characters allowed at the START of a CSS identifier (no digits: a custom
// ident cannot begin with a digit; `-` is handled separately as the optional
// `-?` prefix in the runtime regex and as an ordinary (non-digit) character at
// the type level). Written as a single literal so `CharsOf` can split it.
export const ALLOWED_IDENTIFIER_START =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";

// Every character allowed anywhere in a CSS identifier: the start characters
// plus digits and the hyphen. A single literal so `CharsOf` can split it.
export const ALLOWED_IDENTIFIER_CHARS =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789-";

// The non-ASCII range the runtime additionally accepts, as a regex source
// fragment (a character range, so it cannot be a CharsOf element).
export const NON_ASCII_IDENTIFIER_RANGE = "\\u00A0-\\uFFFF";

// Split a string into a union of its characters. Peels several characters per
// recursion level (instead of one) so the recursion depth stays well under
// TypeScript's instantiation limit even for the full 64-character identifier
// alphabet.
export type CharsOf<S extends string> = string extends S
  ? never
  : S extends `${infer A}${infer B}${infer C}${infer D}${infer Rest}`
    ? A | B | C | D | CharsOf<Rest>
    : S extends `${infer A}${infer B}${infer C}${infer Rest}`
      ? A | B | C | CharsOf<Rest>
      : S extends `${infer A}${infer B}${infer Rest}`
        ? A | B | CharsOf<Rest>
        : S extends `${infer A}${infer Rest}`
          ? A | CharsOf<Rest>
          : never;

// Every legal ASCII CSS identifier character, derived from the data const.
export type CSSIdentifierCharacter = CharsOf<typeof ALLOWED_IDENTIFIER_CHARS>;

// The digits, as a separate union (used to reject a digit at the start).
export type CSSIdentifierDigit = CharsOf<"0123456789">;

// Whether `S` contains any character outside `Allowed`. `S` is a single,
// already-split identifier.
export type ContainsIllegalCharacter<
  S extends string,
  Allowed extends string,
> = S extends `${infer Head}${infer Tail}`
  ? Head extends Allowed
    ? ContainsIllegalCharacter<Tail, Allowed>
    : true
  : false;

// Escape a literal character for use inside a regex character class. Only `-`
// (and the class terminators) are special here; `-` must be escaped so it does
// not form a range with its neighbours.
function escapeClassChar(c: string): string {
  return c === "-" || c === "\\" || c === "]" || c === "^" ? `\\${c}` : c;
}

function classSource(chars: string, range: string): string {
  let src = "";
  for (const c of chars) src += escapeClassChar(c);
  return src + range;
}

const IDENT_START_CLASS = classSource(
  ALLOWED_IDENTIFIER_START,
  NON_ASCII_IDENTIFIER_RANGE,
);
const IDENT_CHARS_CLASS = classSource(
  ALLOWED_IDENTIFIER_CHARS,
  NON_ASCII_IDENTIFIER_RANGE,
);

// A legal CSS identifier: an optional leading hyphen, a start character, then
// zero or more identifier characters. Built from the same data strings that
// drive the type-level unions.
export const CSS_IDENTIFIER_REGEX = new RegExp(
  `^-?[${IDENT_START_CLASS}][${IDENT_CHARS_CLASS}]*$`,
);
