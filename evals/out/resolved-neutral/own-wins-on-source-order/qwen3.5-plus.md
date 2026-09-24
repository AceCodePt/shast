# own-wins-on-source-order — opencode/qwen3.5-plus

- arm: `resolved`
- probes: the inverse of dead-declaration: a node's own block sometimes does win
- expected: 64px — `&.big` ties on specificity and is printed later
- parsed answer: `64px`
- verdict: **PASS**
- elapsed: 13940ms

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

Based on the rendered information provided, the `root>child` element shows `padding: 64px` in its computed styles. The note explicitly states this value "shadows" (overrides) both the `padding: 4px` declared by the parent's `"> child"` block and the `padding: 32px` declared at the top of the child's own CSS block. The 64px value from the `"&.big"` block wins the CSS cascade.

ANSWER: 64px
