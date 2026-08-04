# own-wins-on-source-order — opencode/glm-5

- arm: `resolved`
- probes: the inverse of dead-declaration: a node's own block sometimes does win
- expected: 64px — `&.big` ties on specificity and is printed later
- parsed answer: `64px`
- verdict: **PASS**
- elapsed: 20569ms

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

## Reasoning

The rendered box for `root>child` explicitly shows `padding: 64px` in its resolved styles. Three sources competed:

1. **`padding: 32px`** — `root>child`'s own base CSS block (top-level).
2. **`padding: 4px`** — `root`'s `> child` block (a parent/nested rule targeting the child).
3. **`padding: 64px`** — `root>child`'s `&.big` block (a compound selector adding the `.big` class).

The `&.big` rule compiles to a selector that combines the base element selector with the `.big` class (e.g., `.child.big` or similar), giving it higher specificity than both the plain base rule (32px) and the parent's `> child` rule (4px). Higher specificity wins regardless of source order, so the 64px declaration from the `&.big` block is what the browser applies. This is confirmed by the rendered geometry: with 64px padding on all sides, the content area is `500 − 128 = 372px` wide, and the total height of `147.19px` is consistent with 64px top/bottom padding around a single line of 16px text.

ANSWER: 64px
