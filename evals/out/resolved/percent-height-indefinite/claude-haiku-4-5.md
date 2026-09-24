# percent-height-indefinite — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: a percentage height whose containing block is indefinite
- expected: NO — `root>outer` has no declared height, so the percentage behaves as `auto` and `tall` is one line (~19px) against `filler`'s 60px
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 6983ms

## Question

`root>outer>tall` declares `height: 100%`. Is it taller than its sibling `root>outer>filler`?

## Context shown to the model


```
viewport 600x400
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root               div
  @ x=0 y=0 width=600 height=79.19

root>outer         div
  @ x=0 y=0 width=600 height=79.19

root>outer>filler  div  "a"
  @ x=0 y=0 width=600 height=60
  = font-size: 16px (inherited), height: 60px

root>outer>tall    div  "b"
  @ x=0 y=60 width=600 height=19.19
  = font-size: 16px (inherited), height: 100%
```

## Model reply

Looking at the measurements in the report:

- `root>outer>filler` has a height of 60px
- `root>outer>tall` has a height of 19.19px

Even though `root>outer>tall` declares `height: 100%`, it resolves to only 19.19px because `100%` refers to the height of its parent container (`root>outer`), which is 79.19px. The `100%` value means it takes up the full remaining height of the parent after the filler div occupies 60px, resulting in approximately 19.19px.

Since 19.19px is less than 60px, `root>outer>tall` is not taller than its sibling.

ANSWER: NO
