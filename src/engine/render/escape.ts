// The escaping seam.
//
// Everything the renderer writes into markup passes through here. There are two
// policies, and they are here together because they answer the same question —
// "may this author string be pasted into the output verbatim?" — with the same
// answer, no:
//
//   - `escapeAttributeValue` covers HTML *syntax*. An attribute value is data,
//     so the five HTML-significant characters are written as entities.
//   - `semanticAttribute` covers HTML *identity*. A child name becomes an
//     attribute that a `> name` selector also emits, so it must be encoded
//     injectively — distinct names must never collide onto one attribute.
//
// They are separate functions rather than one because their alphabets differ:
// an attribute value only needs to survive a parser, while a semantic name also
// has to be a valid CSS identifier and to round-trip. Keeping the policy in one
// file makes that difference visible instead of implied by whichever module
// happened to own each function.

const PREFIX = "cid-";

/**
 * HTML-encode an attribute value.
 *
 * The value is a string the author wrote, not markup, so `&`, `<`, `>`, `"` and
 * `'` are data and must be written as entities. Without this a value like
 * `say "hi"` closes the attribute early -- `title="say "hi""` is three tokens to
 * a parser -- and `<` or `&` are read as the start of a tag or a reference.
 *
 * `&` is encoded first, or the `&` of every later entity would be encoded again
 * (`&lt;` would become `&amp;lt;`, rendering as a literal `&lt;`).
 *
 * This is deliberately *not* applied to `innerHTML` text: the DSL's `innerHTML`
 * carries markup, so encoding it would render tags as visible text. Attribute
 * values carry no markup, so here encoding is unconditional.
 */
export function escapeAttributeValue(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * The attribute a `"> name"` child selector emits and the HTML identifier the
 * child carries, derived from the raw child name.
 *
 * A child name is any string the author writes (the key is never validated),
 * so it cannot be pasted into an attribute name or a CSS identifier verbatim:
 * `"my item"` would emit `<span cid-my item>` and `& > [cid-a"]b]`. The name
 * is therefore encoded rather than rejected. `[A-Za-z0-9-]` maps literally;
 * every other UTF-16 code unit, including `_` itself, maps to `_` followed by
 * its four-digit lowercase hex. Escaping the marker as `_005f` makes the
 * encoding injective: distinct names can never collide onto one attribute, so
 * a `> name` selector can never match a different child. Ordinary names are
 * unchanged.
 */
export function semanticAttribute(name: string): string {
  let escaped = "";
  for (let index = 0; index < name.length; index += 1) {
    const code = name.charCodeAt(index);
    const isLiteral =
      (code >= 0x61 && code <= 0x7a) || // a-z
      (code >= 0x41 && code <= 0x5a) || // A-Z
      (code >= 0x30 && code <= 0x39) || // 0-9
      code === 0x2d; // -
    escaped += isLiteral
      ? String.fromCharCode(code)
      : `_${code.toString(16).padStart(4, "0")}`;
  }
  return `${PREFIX}${escaped}`;
}
