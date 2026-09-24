# dead-hover — opencode/glm-5

- arm: `resolved`
- probes: a `:hover` block that is overruled, which is invisible unless it is reported
- expected: NO — the root's `> mid > leaf` block outranks the :hover, so the hover declaration is dead
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 8074ms

## Question

`root>mid>leaf` has a `:hover` block setting `padding: 40px`. Does hovering over it change its padding?

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
```

## Model reply

No. The `:hover` block sets `padding: 40px`, but `padding: 2px` is declared by `root` inside its `> mid > leaf` block, which outranks the `:hover` rule. Entering `:hover` does not change the padding.

ANSWER: NO
