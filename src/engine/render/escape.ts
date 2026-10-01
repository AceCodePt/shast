// The escaping seam. Everything the renderer writes into markup passes through
// here. One invariant: a string the author writes is *data*, never markup. Only
// the characters that would change how a parser reads the output are encoded,
// and which those are depends on where the string lands:
//
//   - `escapeAttributeValue` covers an attribute value, where a quote would end
//     the attribute early.
//   - `escapeText` covers a text node, where `<` or `&` would start a tag or a
//     reference.
//   - `semanticAttribute` covers HTML *identity*: a child name becomes an
//     attribute a `> name` selector also emits, so it must be encoded
//     injectively -- distinct names must never collide onto one attribute.
//
// They are separate functions because their alphabets differ. Keeping the
// policy in one file makes those differences visible rather than implied by
// whichever module owned each function.

const PREFIX = "cid-";

/**
 * HTML-encode an attribute value.
 *
 * `&`, `<`, `>`, `"` and `'` are data and must be written as entities: without
 * this a value like `say "hi"` closes the attribute early, and `<` or `&` are
 * read as the start of a tag or a reference. `&` is encoded first, or the `&`
 * of every later entity would be encoded again.
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
 * HTML-encode a text node.
 *
 * A string anywhere under `innerHTML` is a *text node*, not markup: the DSL has
 * no way to write a raw HTML string, and the registry enforces it -- a string
 * child is only legal where the tag declares `"#text"`. So `<` and `&` are data
 * and are written as entities.
 *
 * There is deliberately no raw/unescaped escape hatch. Markup is expressed by
 * nesting a component (`{ tag: "b", innerHTML: "bold" }`), which keeps the tree
 * the single source of truth every structural guarantee is derived from. A raw
 * string would be a subtree the renderer emits but cannot see.
 *
 * `"` and `'` are left alone: they are harmless in text content.
 */
export function escapeText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/**
 * The attribute a `"> name"` child selector emits and the HTML identifier the
 * child carries, derived from the raw child name.
 *
 * A child name is any string the author writes (the key is never validated), so
 * it cannot be pasted into an attribute name or a CSS identifier verbatim:
 * `"my item"` would emit `<span cid-my item>`. The name is therefore encoded
 * rather than rejected. `[a-z0-9-]` maps literally; every other UTF-16 code
 * unit, including uppercase letters and `_` itself, maps to `_` followed by its
 * four-digit lowercase hex. Uppercase is folded here, not at either use site,
 * because an HTML attribute name is lowercased by the parser and CSS
 * attribute-name matching is ASCII case-insensitive: `cid-Title` and `cid-title`
 * would collapse to one attribute. Escaping the marker as `_005f` makes the
 * encoding injective, so a `> name` selector can never match a different child.
 * Ordinary all-lowercase names are unchanged.
 */
export function semanticAttribute(name: string): string {
  let escaped = "";
  for (let index = 0; index < name.length; index += 1) {
    const code = name.charCodeAt(index);
    const isLiteral =
      (code >= 0x61 && code <= 0x7a) || // a-z
      (code >= 0x30 && code <= 0x39) || // 0-9
      code === 0x2d; // -
    escaped += isLiteral
      ? String.fromCharCode(code)
      : `_${code.toString(16).padStart(4, "0")}`;
  }
  return `${PREFIX}${escaped}`;
}
