# Recipes

Short, focused excerpts of the building blocks. Each one is a fragment of the
card in [`worked-example.md`](worked-example.md) or its registry.

## Registering and referencing a custom property

The registry is the source of truth: an unregistered name is rejected
unconditionally, and `@property` rules are emitted from the same entries.

```ts
const cssProperties = cssPropertiesConfig(SUPPORTED_KEYWORDS, commonCSSSyntax, {
  "--space": { syntax: "<length>", inherits: false, "initial-value": "0.5rem" },
  "--brand": { syntax: "<color>", inherits: true, "initial-value": "hsl(220 90% 56%)" },
});

// used standalone, in a shorthand, and inside calc():
padding: "var(--space)";
border: "1px solid var(--brand)";
gap: "calc(var(--space) * 2)";   // also needs display: flex | grid on this element
```

`var()` takes exactly one argument on purpose. A fallback
(`var(--space, 1rem)`) can never be read, because a registered property always
resolves to its registered `initial-value`:

```
server  Invalid var() value: var() takes no fallback; the registered
        initial-value of --space applies instead (see docs/css-var.md)
```

## `calc()`

Operands are typed by dimension. `+`/`-` need the same dimension (percentage
acts as the wildcard), `/` needs a unitless right operand or one of the same
dimension, and a multiplicative run may carry at most one unit. The result
must match the property's slot.

```ts
display: "grid";
width: "calc(100% - var(--space))";  // <length-percentage> slot; percentage is the + / - wildcard
gap: "calc(var(--space) * 2)";       // <length> * <number> -> <length>
font-size: "calc(var(--space) * 3)"; // <length-percentage> slot
```

## Registered queries and keyframes

Both are keyed by exact, registered strings - not by a parser that might
disagree. Register the small set you use; an unregistered key is a compile
error and a runtime throw.

```ts
cssQueriesConfig: ["@media (width < 768px)", "@container (width > 400px)"],
cssKeyframesConfig: cssKeyframesConfig(commonCSSSyntax, commonCSSAttributes, {
  fade: { from: { opacity: "0" }, to: { opacity: "1" } },
}),
```

```ts
"@media (width < 768px)": { display: "grid", "grid-template-columns": "auto" },
animation: "fade 1s linear",     // renders the referenced @keyframes exactly once
```

## Conditional disclosure: gates unlock

`display: flex` unlocks `gap` on the same element; `display: grid` unlocks
`grid-template-areas` and, for its children, `grid-area`. An attribute gate
works the same way: `input[type=checkbox]` unlocks `checked`, and a gate whose
value is a single literal is filled in for you when omitted.

A gate is **element-scoped**, and the element does not change because the block
that styles it did: the gates follow the element into every block that targets
it - `:hover`, `@media`, `@container`, `&.class` - so a single `display: flex`
at the component level unlocks `gap` and `justify-content` inside all of them.
The gates **reset at a different box**: a `> child` block starts from the
child's own gates (plus its implicit display), and a `::before` / `::after`
block generates its own box, so its *self* slot needs its own `display`, while
its *children* half (e.g. `flex`) still reads the element's gates.

```ts
// valid - display: grid unlocks the grid properties, and the child's
// grid-area is checked against the element's literal areas even through :hover
css: {
  display: "grid",
  "grid-template-areas": '"heading price" "perks perks"',
  "> heading": { "grid-area": "heading" },
  ":hover": {
    "> heading": { "grid-area": "heading" },
    gap: "1rem",
  },
}
```

## Valid when context becomes known

A reusable child does not need to know its parent when it is defined. Its
literal structure is preserved, then checked again when a parent supplies the
missing context:

```ts
const item = { tag: "li", innerHTML: "item" } as const;

createComponent({
  tag: "ul",
  innerHTML: { item }, // valid: <ul> permits <li>
});
```

The same child embedded under a parent that does not permit `<li>` is rejected
at the parent call. This is not limited to direct children: the
ancestral-inheritance rules already thread parent context through an entire
prebuilt subtree. Unknown context is not guessed at; once composition makes it
known, validity is narrowed there.
