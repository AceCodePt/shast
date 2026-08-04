# own-wins-on-source-order — opencode/gpt-5.4-nano

- arm: `resolved`
- probes: the inverse of dead-declaration: a node's own block sometimes does win
- expected: 64px — `&.big` ties on specificity and is printed later
- parsed answer: `64px`
- verdict: **PASS**
- elapsed: 9156ms

## Question

Three different blocks declare `padding` for `root>child`. What padding does it actually render with?

## Context shown to the model


```
viewport 500x300
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root        div
  @ x=0 y=0 width=500 height=147.19

root>child  div  "Child"
  @ x=0 y=0 width=500 height=147.19
  = font-size: 16px (inherited), padding: 64px
  ← padding: 64px   declared by root>child itself, inside its "&.big" block   — shadows padding: 4px declared by root, inside its "> child" block; also padding: 32px declared by root>child itself, at the top of its css block
```

## Model reply

The rendered output explicitly lists `padding: 64px` for `root>child`, meaning that 64px is the final, applied padding after CSS cascade/shadowing. The trace then clarifies that this `64px` “shadows” (overrides) the other declarations: `4px` from `root`’s `> child` block and `32px` from `root>child`’s earlier top-of-block declaration, both of which are superseded by the later/more-specific `&.big` rule.

ANSWER: 64px
