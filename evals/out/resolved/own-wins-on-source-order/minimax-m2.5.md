# own-wins-on-source-order — opencode/minimax-m2.5

- arm: `resolved`
- probes: the inverse of dead-declaration: a node's own block sometimes does win
- expected: 64px — `&.big` ties on specificity and is printed later
- parsed answer: `64px`
- verdict: **PASS**
- elapsed: 8255ms

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

The selector `&.big` inside `root>child` expands to `root>child.big`, which carries one extra class compared to the plain `root>child` and `root > child` selectors (specificity 0,2,1 vs 0,1,1). Higher specificity beats source order, so it shadows both other declarations. The report also confirms this directly by stating `padding: 64px` shadows the 4px and 32px values.

ANSWER: 64px
