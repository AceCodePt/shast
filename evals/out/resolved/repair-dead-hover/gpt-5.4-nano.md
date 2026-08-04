# repair-dead-hover — opencode/gpt-5.4-nano

- arm: `resolved`
- probes: naming the block that is killing a state, not the state's own block
- expected: root — its `> mid > leaf` block is (0,3,0) and outranks the leaf's own `:hover` at (0,2,0), so the hover is dead until the root's block changes
- parsed answer: `root`
- verdict: **PASS**
- elapsed: 8575ms

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

The report says `:hover { padding: 40px }` is already present in `root>mid>leaf`’s own CSS block, but hovering changes nothing because a different rule wins: `padding: 2px` declared by `root` inside its `"> mid > leaf"` block outranks the hover rule. To make the hover padding of 40px take effect, you must remove or lower the specificity/priority of that overriding `padding: 2px` rule from the `root` node’s CSS block.

ANSWER: root
