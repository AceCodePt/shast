# Browser baseline for the emitted CSS

`renderComponent` emits **nested** CSS - `& > [data-cid-x]`, `&:hover`, `&.featured`,
and `@media` blocks written inside a rule - not flattened selectors. A browser
has to understand that nesting to run any of it. The minimum versions that do:

| Browser         | Minimum version |
| --------------- | --------------- |
| Chrome / Edge   | 112             |
| Safari          | 16.5            |
| Firefox         | 117             |

The example stylesheet in [`worked-example.md`](worked-example.md) is the exact
output format; `& > [data-cid-heading]` is a nested rule, not an accident of
formatting.

The output relies on three more features besides nesting, so check them too:

- **`@media` range syntax** - queries are registered as literal strings such as
  `@media (width < 768px)`, and `collect-rules.ts` prints them verbatim rather
  than rewriting them to `max-width`. That form is baseline 2023: Chrome/Edge
  104+, Safari 16.4+, Firefox 102+ ([MDN][mdn-range]). On an older engine the
  whole query block is dropped.
- **`@property`** - `renderCSSPropertiesConfig` emits one `@property` rule per
  registered custom property (see [`worked-example.md`](worked-example.md)). It
  registered as baseline widely available in 2024: Chrome/Edge 85+, Safari
  16.4+, Firefox 128+ ([MDN][mdn-at-property]). Without it the property still
  resolves through `var()`; only its registered syntax, inheritance and initial
  value are lost.
- **`@container`** - queries are typed as `@media ...` or `@container ...`
  alike, so if your registry contains an `@container` key, the output may carry
  one. That is a separate, later baseline: Chrome/Edge 105+, Safari 16+,
  Firefox 110+ ([MDN][mdn-at-container]). A browser without container queries
  drops the block just as silently.

Nesting is used on purpose: the cascade shast resolves and the browser resolves
come from the same facts. A `"> name"` key is a child of *this* element, and
`&.featured` is a state of *this* element, so printing them nested keeps the
selector text literally equal to the authoring structure - the same structure
`collectRules` walks to report provenance ("which block declared this?"). It is
produced in one place: `printBlock` in
[`src/engine/render/collect-rules.ts`](../src/engine/render/collect-rules.ts), the
same frames the resolver reads.

**The consequence on older runtimes.** A browser without CSS Nesting parses
none of it. A nested rule inside a declaration block is invalid there, so the
stylesheet is dropped - with no error, console message or exception. The page
renders with its HTML intact and **no styling at all**, which is precisely the
silent, browser-only failure shast exists to move earlier. The same is true for
each feature above: an unparsed `@property`, `@container` or range `@media`
block is not an error to the browser, only a rule that never applies. Either
raise your browser floor to the versions in the table, or flatten the emitted
stylesheet yourself before shipping; shast does not emit a fallback copy.

[mdn-range]: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries#syntax
[mdn-at-property]: https://developer.mozilla.org/en-US/docs/Web/CSS/@property
[mdn-at-container]: https://developer.mozilla.org/en-US/docs/Web/CSS/@container
