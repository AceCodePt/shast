# repair-dead-hover — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: naming the block that is killing a state, not the state's own block
- expected: root — its `> mid > leaf` block is (0,3,0) and outranks the leaf's own `:hover` at (0,2,0), so the hover is dead until the root's block changes
- parsed answer: `root`
- verdict: **PASS**
- elapsed: 8350ms

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

Looking at the report, the issue is a specificity problem. The `root>mid>leaf` element has `:hover { padding: 40px }` in its own CSS block, but it's not working because there's a more specific rule that takes precedence.

The report explicitly states: "padding: 2px declared by root, inside its '> mid > leaf' block outranks it — entering `:hover` does not change padding"

This means the `root` node has a CSS rule in its `> mid > leaf` block that declares `padding: 2px`. This rule is more specific than the `:hover` pseudo-class selector on the element itself, so it wins in the cascade.

To fix this, you need to increase the specificity of the `:hover` rule by moving it to the `root` node's `> mid > leaf` block (where the conflicting rule already exists), so both rules have equal specificity and the `:hover` can properly override the base padding value. Alternatively, you could add `> mid > leaf:hover` as a rule in the `root` block's CSS to match the specificity of the existing `> mid > leaf` rule.

ANSWER: root
