# CSS semantic rules: does this declaration do anything here?

shast's first walls answer *"is this token legal?"* — is `gap` a known
property, is `2s` a legal value for it. The semantic rules answer the next
question: **does this declaration do anything in its structural context?** A
`gap` on an element that is not a flex/grid container, a `grid-area` naming an
area the parent never declares, `width` on an inline element — all are legal
CSS tokens, and all are silently ignored (or wrong) in the browser. These
rules reject them at both walls instead.

They are threaded the same way as `innerHTML` ancestral inheritance: a rule
that needs context reads it from the enclosing block, at compile time and at
runtime. The catalog is ordered by type-system cost, cheapest tier first, so
the checks that pay for themselves land first and the heavy ones stay gated
behind the performance budget.

This is a living catalogue of what is shipped and what is planned. Each
shipped rule is validated at the type level and at runtime; the browser
behaviour it replaces is listed in
[`before-the-browser.md`](before-the-browser.md).

## Shipped: Tier A — same-node rules

No threading; the answer is inside the one block.

- `z-index` requires a stacking context (`position` ≠ static, or an
  opacity/transform/filter that establishes one).
- Inline elements reject `width`, `height`, `margin-top`, `margin-bottom`.
- `vertical-align` is valid only on inline / inline-block / table-cell.
- `text-align` is a block-container property.
- Container-only properties (`gap`, `justify-content`, `align-items`)
  require the element's own `display` to be flex/grid — the conditional
  disclosure that `display: flex` unlocks them.

## Shipped: Tier B — one-level parent → child threading

The child's validity depends on the parent's own declaration.

- Flex/grid item properties (`flex`, `order`, `align-self`, `grid-column`,
  `grid-row`) require a flex/grid parent.
- `grid-area` names an area the parent's `grid-template-areas` must declare
  (see `archive/css-semantic-grid-area`).

## Planned: Tier C — ancestor-chain boolean threading

- `position: absolute` needs a positioned ancestor.
- `position: sticky` needs a threshold and no scroll-clipping ancestor.
- `position: fixed`'s containing block changes under an ancestor `transform`
  / `filter` / `will-change`.
- `overflow` clipping an absolutely-positioned descendant.
- `height: 100%` chaining to a definite-height ancestor.

## Planned: Tier D — union-carrying (gated behind the perf budget)

- Conditional `display` invalidating child layout props (error only when
  meaningless in every state).
- Multi-state dead-property detection.

## Out of scope (not statically decidable)

These depend on facts outside the component tree (the render context, the
layout engine, the cascade, or user intent), so shast does not pretend to
check them:

- `inherit` values and colour contrast.
- Actual content overflow / fit.
- Flex `min-width: auto` overflow (needs intrinsic content size).
- Specificity / `!important` conflicts across components.
- `100vw` scrollbars, missing assets, responsive design intent.

The principle: shast checks what is mechanically decidable from the declared,
unconditional facts it owns, at the definition site, before the browser sees
the component. Anything conditional on a media query, a pseudo-class, or an
unknown ancestor stops having a yes/no answer and is deliberately not guessed
at.
