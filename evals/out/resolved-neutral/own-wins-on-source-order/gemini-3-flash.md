# own-wins-on-source-order — opencode/gemini-3-flash

- arm: `resolved`
- probes: the inverse of dead-declaration: a node's own block sometimes does win
- expected: 64px — `&.big` ties on specificity and is printed later
- parsed answer: `64px`
- verdict: **PASS**
- elapsed: 9957ms

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

The information provided states that `root>child` has a resolved padding of `64px`. It explicitly notes that the `64px` declaration within the `&.big` block shadows the other two declarations (`4px` from the parent and `32px` from its own top-level block). Additionally, the rendered height of `147.19px` is consistent with a `16px` font-size and `64px` padding on both the top and bottom.

ANSWER: 64px
