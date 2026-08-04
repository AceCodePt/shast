# percent-height-indefinite — opencode/glm-5

- arm: `resolved`
- probes: a percentage height whose containing block is indefinite
- expected: NO — `root>outer` has no declared height, so the percentage behaves as `auto` and `tall` is one line (~19px) against `filler`'s 60px
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 8270ms

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

No. The `height: 100%` on `root>outer>tall` resolves to 100% of its parent's height. The parent `root>outer` is 79.19px tall, but `tall` is positioned after `filler` (which takes 60px), so the remaining height resolves to 19.19px. Since 19.19px < 60px, `tall` is shorter than its sibling `filler`.

ANSWER: NO
