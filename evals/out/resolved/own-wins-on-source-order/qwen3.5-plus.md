# own-wins-on-source-order — opencode/qwen3.5-plus

- arm: `resolved`
- probes: the inverse of dead-declaration: a node's own block sometimes does win
- expected: 64px — `&.big` ties on specificity and is printed later
- parsed answer: `64px`
- verdict: **PASS**
- elapsed: 12380ms

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

The report explicitly shows that `root>child` renders with `padding: 64px`. This is stated directly in the line `= font-size: 16px (inherited), padding: 64px` and confirmed by the explanation arrow which notes that `padding: 64px` (declared in the `"&.big"` block) shadows both the `padding: 4px` from the parent and the `padding: 32px` declared at the top of `root>child`'s own CSS block. The `&.big` selector has higher specificity, so its padding value wins the cascade.

ANSWER: 64px
