# Structural Coupling: CSS That Cannot Outlive Its Markup

## The aim

The core problem this library exists to solve is **not** writing HTML or CSS —
it is *changing* them. When the structure of the HTML changes and the CSS that
targeted the old structure is forgotten, nothing fails: selectors silently stop
matching, dead rules accumulate, and the stylesheet drifts away from the markup
it describes. No mainstream tool catches this. CSS Modules can prove a *class*
exists; nothing proves the *structure* a selector assumes still exists.

Here, a component's CSS is keyed off the component's own structure:

- children are **named** (`innerHTML: { title: ... }`), so styles have stable
  structural handles instead of positional/tag selectors,
- child selectors (`> title`) are typed as keys of that structure,
- so renaming, removing, or moving a child makes the CSS that targeted it a
  **compile error at the same call site**.[^squiggle]

Change the structure and the stale CSS is not a runtime surprise or a visual
bug — it is a red squiggle.

[^squiggle]: The compile error is conditional. TypeScript suppresses its
excess-property check when the same object literal already contains another
error, so `css: { width: "banana", "> title": { ... } }` reports only the
`width` error and the stale selector surfaces once that is fixed. Errors are
not reported all at once, but the component does not compile until every one
is resolved, and the runtime wall catches the stale selector regardless.

## Two walls, one contract

Every rule is enforced twice, by design:

1. **Type level** — `ValidateComponentStructure` rewrites invalid structures
   into error types. This is the interactive wall: humans get it in the
   editor, AI agents get it from `tsc`.
2. **Runtime** — `validateComponentNode` walks the real object and throws
   with a structured message. This is the backstop wall: it holds even when
   the type layer is bypassed (`as any`, generated code, data from outside
   the compiler's view).

The two layers are required to agree; divergence is treated as a bug. They
agree today: the runtime wall checks pseudo-class/element *usage* by membership
against the registered vocabulary, so both walls reject an unregistered key.

### Where the runtime wall lives

The runtime wall is split along the same seam as the type wall, so anyone
auditing "do the two walls agree?" reads one file per layer instead of one
600-line function:

- `src/engine/validate/context.ts` — the registry snapshot every walk shares,
  passed as one value rather than a dozen positional parameters.
- `src/engine/validate/html.ts` — tag, attribute, gate, required-attribute and
  child-structure checks: the runtime counterpart of the HTML gate tables.
- `src/engine/validate/css.ts` — the `css` block: selectors, gates, values
  (`calc()` / `var()`), keyframe references, `grid-area` cross-references.
- `src/engine/gate-resolution.ts` — the gate machinery both layers import. Each
  helper mirrors a type-level table in `src/engine/types.ts`; keeping the pairs
  side by side is what makes the agreement auditable rather than coincidental.
- `src/engine/index.ts` — only the `engine()` wiring and the exported
  `validateComponentNode` entry point.

## Verified guarantees

These were established by direct experiment (2026-07), not by intention.
Semantics used: `h1 > b` is valid standalone, but `a` does not allow `b`, so
`a > h1 > b` must fail the inheritance intersection (`a.innerHTML ∩
h1.innerHTML`).

| Scenario | Type level | Runtime |
|---|---|---|
| Inline `a > h1 > b` | rejected | rejected |
| `h1 > b` built by its own `createComponent`, then embedded under `<a>` | rejected at the parent call | rejected |
| Factory with widened return type (`BaseComponentStructure`) embedded under `<a>` | rejected — fails **closed** | rejected |
| Parent css `> heading` targeting a prebuilt child | accepted | accepted |
| Parent css `> headnig` (typo) | rejected | rejected |

Key consequences:

- **Composition does not weaken validation.** `createComponent` returns the
  full literal type, so a parent re-validates the entire subtree under its own
  ancestral context, and the runtime walks the whole tree at the parent call.
  Splitting components across files keeps every guarantee.
- **Widening fails closed, not open.** A component whose type has been widened
  cannot be embedded at all — the type system refuses rather than trusting it.
  Safe, but it imposes the constraint below.

## Element-scoped gates

A gate (`display`, `position`, …) unlocks props on the element itself (`self`)
and on its direct children (`children`). A gate is **element-scoped**: it is a
fact about the target element, not about the block the author happened to write
it in. A `:hover`, `@media`, `@container` or `&.class` block targets the *same*
element, and nothing in CSS changes that element's display, so the gates follow
it into those blocks.

```ts
css: {
  display: "flex",                    // written once, at component level
  ":hover": { gap: "1rem" },          // gap is unlocked: same element
  "@media (width < 768px)": { "justify-content": "center" },
  ":hover": { "> c": { flex: "1" } }, // children slot: still the same element
}
```

The rule resets wherever the target box changes:

- a `> child` block starts from the child's own gates plus the child's tag
  implicit display (the element's gates do **not** reach the child's self slot);
  `gap` inside `> span` still needs the span to be `display: flex` itself.
- a `::before` / `::after` pseudo-element generates its own box, so its *self*
  slot needs its own `display`. But `::before` / `::after` **are** child boxes,
  so the element's children gates apply (`flex` on `::before` is valid when the
  element is flex) - and a `grid-template-areas` literal on the element still
  cross-checks `grid-area` on a `> child` or `::before` through any number of
  `:hover` / query wrappers.

The implicit display a tag declares is added only to the self slot, never to the
children slot: an explicit gate is what unlocks children props.

Both walls thread the same state. The type-level walk carries the element's
effective value (`CSSElementValue`) beside `CSSParent`; the runtime carries
`elementGates` / `elementGridAreas` beside `parentGates` / `parentGridAreas`.
The written value in the innermost block wins over an inherited one (a merge,
not an intersection, so an inherited `display: block` cannot cancel a written
`display: flex`).

## Performance envelope (indicative)

Structural typing at this depth is only viable if it stays cheap. The figures
below were produced by a local benchmark harness that is **not included in
this repository**, so treat them as indicative rather than reproducible.
Measured against the `common` registry on TypeScript 7.0.2:

- `tsc` cost is a **fixed registry load plus a linear per-component term**.
  Loading `common` costs ~1.17M instantiations / ~1.1s before any component
  is checked; each modest component (`ul > li > span`, one `:hover`, one
  nested `> child`) then adds ~15K instantiations / ~25ms (registry only:
  1.17M / 1.15s; registry + 100 components: 2.69M / 3.60s). Instantiation
  counts are machine-stable; times vary by machine.

Practical rule: keep files to a handful of components each and per-file
checking stays small. The fixed constant grows with *config breadth*, not
component size.

### Gate propagation cost (instantiations only)

Threading the element's effective gates through nested blocks is a small,
linear addition. Measured on the `common` registry by differencing marginal
instantiations per component:

- the gate state adds **43,326** instantiations for a component carrying one
  `:hover` plus one `@media` (the merge and the extra type parameter), on top of
  the fixed registry load;
- removing the redundant `display: flex` re-declaration from those blocks now
  costs **1,241 fewer** instantiations for a single component and **1,274
  fewer** for two components (5,585 -> 4,311 marginal plus 1,274). The
  re-declaration itself is what was measured; block cost is otherwise identical
  whether or not a gate is active.

## Constraints on authors

- **Let inference flow.** Do not annotate component factory return types with
  widened types (`BaseComponentStructure`, hand-written interfaces). The
  literal type *is* the validation artifact; widening it makes the component
  unusable as a child (deliberately).
- **Name children meaningfully.** The `innerHTML` keys are the selector
  namespace — they appear in css blocks (`> title`) and in rendered scoped CSS
  (`cid-title`).

## Known gaps

The gaps this document originally tracked are all closed: runtime validates
`> childName` css selector keys against `innerHTML` keys (agreeing with the
type wall), CSS property values — including `calc()` and `var()` — are
validated at both walls, and pseudo-class/element *usage* is checked at runtime
by the same registry membership the type wall applies.

One narrow gap remains, and it is about the *tag config*, not component usage:
the `cssPseudoClass` / `cssPseudoElement` lists a tag declares are only
shape-checked at the type wall (`` `:${string}${string}`[] ``), and there is no
pseudo-element registry, so a tag config that declares `::bogus` is not rejected
by either wall. Component `css` blocks are validated against whatever the tag
declares; the declarations themselves are trusted as author-owned config.

Everything the browser would silently ignore or fail to match is catalogued,
with the archived slice behind each entry, in
[`before-the-browser.md`](before-the-browser.md).

## Non-goals

- Being a rendering framework. Output is plain HTML and CSS strings; how they
  are served is the caller's concern.
- Chasing the entire CSS value grammar for its own sake. The moat is still the
  structure↔style coupling and the closed-world registries, not CSS trivia.
  Grammar is deepened only where a silent browser failure is worth catching —
  which is why `calc()` dimension algebra and `var()` resolution were added to
  both walls (see [`css-calc.md`](css-calc.md), [`css-var.md`](css-var.md)).
