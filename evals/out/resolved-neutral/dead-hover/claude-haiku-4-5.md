# dead-hover — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: a `:hover` block that is overruled, which is invisible unless it is reported
- expected: NO — the root's `> mid > leaf` block outranks the :hover, so the hover declaration is dead
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 9109ms

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

Based on the information provided, the answer is clearly stated in the "dead-state" annotation:

The `:hover` pseudo-class sets `padding: 40px`, but this is overridden by the `padding: 2px` declared in the `root` selector's `> mid > leaf` block. The annotation explicitly states: "entering `:hover` does not change padding."

This is a CSS specificity issue. Both selectors have the same specificity (element selectors), but the `root > mid > leaf` rule is declared later in the cascade and therefore takes precedence. When you hover over the element, the `:hover` state doesn't increase specificity enough to override the non-pseudo-class rule, so the padding remains at 2px.

ANSWER: NO
