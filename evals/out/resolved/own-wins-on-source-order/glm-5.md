# own-wins-on-source-order — opencode/glm-5

- arm: `resolved`
- probes: the inverse of dead-declaration: a node's own block sometimes does win
- expected: 64px — `&.big` ties on specificity and is printed later
- parsed answer: `64px`
- verdict: **PASS**
- elapsed: 25122ms

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

Three blocks declare `padding` for `root>child`: 4px (from `root`'s `> child` block), 32px (from `root>child`'s own top-level block), and 64px (from `root>child`'s `&.big` block). The report marks the 64px declaration with the arrow `←` and says it "shadows" the other two, and the resolved computed style line (`= ... padding: 64px`) confirms the winning value. The `&.big` selector compiles to a compound class like `.child.big`, which is at least as specific as the parent-child rule and wins by specificity/source order, so it overrides both the 4px and 32px declarations.

ANSWER: 64px
