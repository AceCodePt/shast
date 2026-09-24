# dead-hover — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: a `:hover` block that is overruled, which is invisible unless it is reported
- expected: NO — the root's `> mid > leaf` block outranks the :hover, so the hover declaration is dead
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 7284ms

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

Based on the report, the answer is clear from the analysis provided.

The report explicitly states that `root>mid>leaf` has a "dead-state" because the `:hover` pseudo-class rule setting `padding: 40px` is being outranked by a more specific rule. The `root` selector has a `> mid > leaf` block that declares `padding: 2px`, and this declaration has higher specificity/priority than the `:hover` rule. 

The report clearly notes: "entering `:hover` does not change padding" — the `:hover` rule is effectively overridden and ignored because the non-hover declaration from `root` is prioritized.

ANSWER: NO
