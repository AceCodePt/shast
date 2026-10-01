# Limitations

Some limitations are **deliberate trade-offs** to keep the type system
snappy; others are **known gaps**. They are listed here rather than hidden in
either category's fine print.

## Known gaps (runtime wall only - the type wall covers these today)

- **Pseudo-class/element usage** in css blocks and pseudo-element
  declarations in the tag config are type-checked but not runtime-checked.

CSS property values and custom properties (`--*`) are now validated at
runtime inside `createComponent`. The remaining gap covers only
pseudo-class/element usage — worth knowing if you rely on the runtime wall
alone (e.g. validating untyped AI output without running `tsc`).

## Wildcard tags admit child nesting the HTML parser repairs

`form` and `dialog` are declared with the wildcard `innerHTML: { all: true }`,
so they admit any child, including another `form`. A tree like
`form > ... > form` is therefore representable: the registry rule says a
wildcard accepts every tag, and nested `form` satisfies it rather than
breaking a promise — no document claims such a tree is unrepresentable in
those words.

Banning a `form` ancestor is mechanically doable, but the validator is
one-directional: it checks a child against its immediate parent's map and does
not carry the ancestor tag chain, so it has no way to see an enclosing `form`.
That is a decision, not an oversight, and it is why the sharpest case is left
to the parser, which repairs nested `form` on the client. The pattern a
consumer is most likely to hit is `<form method="dialog">` inside `<dialog>`
inside an outer `<form>`, where the inner form is dropped from the parsed
tree even though shast emits it.

## Integer-like child keys silently reorder children

JavaScript orders object keys that look like array indices (canonical
non-negative integer strings such as `"0"`, `"1"`, `"42"`) ahead of every
other key, in ascending numeric order, regardless of insertion order. A
numeric `innerHTML` key therefore silently reorders the rendered children.
No guard is added: child names double as nested-CSS selector handles
(`> name`), and `> 1` is not a usable identifier, so numeric keys are already
outside the intended API shape and a runtime rejection would be dead code.
The array form is the supported way to repeat a child.
