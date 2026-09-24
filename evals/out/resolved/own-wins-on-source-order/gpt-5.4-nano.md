# own-wins-on-source-order — opencode/gpt-5.4-nano

- arm: `resolved`
- probes: the inverse of dead-declaration: a node's own block sometimes does win
- expected: 64px — `&.big` ties on specificity and is printed later
- parsed answer: `64px`
- verdict: **PASS**
- elapsed: 10583ms

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

The report’s computed box styles list `padding: 64px` for `root>child`, so that is what is actually rendered. The accompanying note says the `padding: 64px` from `root>child`’s own `&.big` block “shadows” the other declarations (`4px` from `root > child` and `32px` from the top of `root>child`’s CSS block). Therefore the final effective padding is 64px.

ANSWER: 64px
