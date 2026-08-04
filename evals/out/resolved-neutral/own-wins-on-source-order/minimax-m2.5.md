# own-wins-on-source-order — opencode/minimax-m2.5

- arm: `resolved`
- probes: the inverse of dead-declaration: a node's own block sometimes does win
- expected: 64px — `&.big` ties on specificity and is printed later
- parsed answer: `64px`
- verdict: **PASS**
- elapsed: 9155ms

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

Three declarations exist for `root>child`:

1. `.root > .child` (from `root`'s `> child` block) — specificity (0,2,0)
2. `.root > .child` (base of `root>child`) — specificity (0,2,0)
3. `.root > .child.big` (from `root>child`'s `&.big` block) — specificity (0,3,0)

The `&.big` nesting compiles to `.big` appended to the parent selector, giving it three class selectors instead of two. With higher specificity, it wins regardless of source order. The rendered box width of 500px (border-box) is also consistent with 64px padding (content area = 500 − 128 = 372px).

ANSWER: 64px
