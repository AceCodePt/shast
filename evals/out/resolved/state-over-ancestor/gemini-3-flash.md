# state-over-ancestor — opencode/gemini-3-flash

- arm: `resolved`
- probes: a state delta on top of a three-level cascade, where the resting winner is not the node's own
- expected: 2px — the root's three-segment selector outranks the node's own :hover, so hovering changes nothing
- parsed answer: `2px`
- verdict: **PASS**
- elapsed: 10553ms

## Question

What padding does `root>mid>leaf` render with while the pointer is hovering over it?

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
  ← padding: 2px   declared by root, inside its "> mid > leaf" block   — shadows padding: 10px declared by root>mid, inside its "> leaf" block; also padding: 20px declared by root>mid>leaf itself, at the top of its css block
```

## Model reply

The report states that the `root>mid>leaf` element renders with `padding: 2px`. Although entering the `:hover` state attempts to set the padding to `40px`, the report explicitly notes that the `padding: 2px` declaration (from the `root` block) outranks the hover style, meaning that entering `:hover` does not change the padding.

ANSWER: 2px
