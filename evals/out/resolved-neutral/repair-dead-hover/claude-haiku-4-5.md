# repair-dead-hover — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: naming the block that is killing a state, not the state's own block
- expected: root — its `> mid > leaf` block is (0,3,0) and outranks the leaf's own `:hover` at (0,2,0), so the hover is dead until the root's block changes
- parsed answer: `root`
- verdict: **PASS**
- elapsed: 8741ms

## Question

You want `root>mid>leaf` to grow to 40px of padding on hover. Which node's css block do you have to edit to get it?

## Context shown to the model


```
viewport 500x300
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root           div
  @ x=0 y=0 width=500 height=23.19

root>mid       div
  @ x=0 y=0 width=500 height=23.19

root>mid>leaf  div  "Leaf"
  @ x=0 y=0 width=500 height=23.19  dead-state
  = font-size: 16px (inherited), padding: 2px
  ! dead-state: `:hover` sets padding: 40px, but padding: 2px declared by root inside its "> mid > leaf" block outranks it — entering `:hover` does not change padding
  ← padding: 2px   declared by root, inside its "> mid > leaf" block   (adds)

The evidence above is the page exactly as it stands. Consider that `:hover { padding: 40px }` has already been added to `root>mid>leaf`'s own css block — it is there in the source — and hovering changes nothing. You are not shown a rendering of the outcome — work it out from the evidence.
```

## Model reply

Looking at the evidence provided:

The issue is that `root>mid>leaf` has `padding: 2px` declared in the `root` node's `> mid > leaf` block. This declaration is more specific than the `:hover { padding: 40px }` rule in `root>mid>leaf`'s own CSS block, so it takes precedence due to CSS specificity and the cascade.

The specificity of a selector matters: `root > mid > leaf` (from the root node's ruleset) is more specific than just `:hover` on the element itself. When both apply, the more specific selector wins, so the padding stays at 2px even on hover.

To make hover work, we need to remove or override the `padding: 2px` declaration from the `root` node's `> mid > leaf` block. This is the only way to let the `:hover` state's `padding: 40px` take effect.

ANSWER: root
