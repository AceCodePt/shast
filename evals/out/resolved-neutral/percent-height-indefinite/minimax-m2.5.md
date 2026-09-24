# percent-height-indefinite — opencode/minimax-m2.5

- arm: `resolved`
- probes: a percentage height whose containing block is indefinite
- expected: NO — `root>outer` has no declared height, so the percentage behaves as `auto` and `tall` is one line (~19px) against `filler`'s 60px
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 7727ms

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

`root>outer>tall` declares `height: 100%`, but CSS percentage heights only resolve against an explicitly sized parent. Since `root>outer`'s height is itself determined by its children (no explicit height set), the percentage is essentially ignored and `tall` gets only the remaining space after `filler` is laid out: 79.19 − 60 = 19.19px.

So `tall` is 19.19px tall, which is much shorter than `filler`'s 60px.

ANSWER: NO
