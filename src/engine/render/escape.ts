// The escaping seam.
//
// Everything the renderer writes into markup passes through here. There is one
// invariant behind all three functions: a string the author writes is *data*,
// never markup. Only the characters that would change how a parser reads the
// output are encoded, and which those are depends on where the string lands:
//
//   - `escapeAttributeValue` covers an attribute value, where a quote would end
//     the attribute early.
//   - `escapeText` covers a text node, where `<` or `&` would start a tag or a
//     reference.
//   - `semanticAttribute` covers HTML *identity*: a child name becomes an
//     attribute that a `> name` selector also emits, so it must be encoded
//     injectively -- distinct names must never collide onto one attribute.
//
// They are separate functions rather than one because their alphabets differ:
// a text node needs no quote handling, an attribute value needs no `_XXXX`
// injectivity, and a semantic name also has to be a valid CSS identifier and to
// round-trip. Keeping the policy in one file makes those differences visible
// instead of implied by whichever module happened to own each function.

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
 * child is only legal where the tag declares `"#text"` in its `innerHTML`, which
 * is how the validator and this renderer agree on what a string means. So the
 * characters that would otherwise start a tag (`<`) or a reference (`&`) are
 * data and are written as entities.
 *
 * There is deliberately no raw/unescaped escape hatch. Markup is expressed by
 * nesting a component (`{ tag: "b", innerHTML: "bold" }`), which keeps the tree
 * the single source of truth that every structural guarantee in this format --
 * permitted children, `> child` selectors, cascade resolution -- is derived
 * from. A raw string would be a subtree the renderer emits but cannot see,
 * which is exactly the state this format exists to make impossible.
 *
 * `"` and `'` are left alone: they are harmless in text content, and encoding
 * them would turn every apostrophe in prose into `&#39;`.
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
 * A child name is any string the author writes (the key is never validated),
 * so it cannot be pasted into an attribute name or a CSS identifier verbatim:
 * `"my item"` would emit `<span cid-my item>` and `& > [cid-a"]b]`. The name
 * is therefore encoded rather than rejected. `[a-z0-9-]` maps literally;
 * every other UTF-16 code unit, including uppercase letters and `_` itself,
 * maps to `_` followed by its four-digit lowercase hex. Uppercase is folded
 * here, not at either use site, because an HTML attribute name is lowercased
 * by the parser and CSS attribute-name matching is ASCII case-insensitive in
 * HTML documents: emitting `cid-Title` and `cid-title` would collapse to one
 * attribute in the browser and a `> Title` selector would match the `title`
 * child too. Encoding `A-Z` as `_00xx` keeps every emitted attribute
 * lowercase, so case-only-distinct names stay distinct after the browser
 * lowercases them. Escaping the marker as `_005f` makes the encoding
 * injective: distinct names can never collide onto one attribute, so a
 * `> name` selector can never match a different child. Ordinary all-lowercase
 * names are unchanged.
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
