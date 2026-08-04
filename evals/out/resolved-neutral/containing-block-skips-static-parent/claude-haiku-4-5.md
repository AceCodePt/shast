# containing-block-skips-static-parent — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: which ancestor an absolutely positioned box resolves against
- expected: 10,10 — `root>plain` is static and is skipped, so the offsets are measured from the root's padding edge at 0,0, not from `root>plain` at 20,20
- parsed answer: `10,10`
- verdict: **PASS**
- elapsed: 9368ms

## Question

At what x,y does the top-left corner of `root>plain>pin` render? Note that `root>plain` is not positioned.

## Context shown to the model


```
viewport 600x400
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root            div
  @ x=0 y=0 width=600 height=100
  = position: relative, padding: 20px

root>plain      div
  @ x=20 y=20 width=560 height=60
  = padding: 30px

root>plain>pin  div  "pinned"
  @ x=10 y=10 width=80 height=20
  = font-size: 16px (inherited), position: absolute, top: 10px, left: 10px, width: 80px, height: 20px
```

## Model reply

Let me work through this step by step.

The `root>plain>pin` element has `position: absolute` with `top: 10px` and `left: 10px`. When an element is absolutely positioned, its position is relative to the nearest positioned ancestor.

Looking at the hierarchy:
- `root` has `position: relative` (it is positioned)
- `root>plain` has no position property mentioned (so it's not positioned)
- `root>plain>pin` has `position: absolute`

Since `root>plain` is not positioned, we skip it when looking for the positioning context. The nearest positioned ancestor is `root`, which has `position: relative`.

The `root` element has its top-left corner at x=0, y=0. The `root>plain>pin` element has `top: 10px` and `left: 10px` relative to its positioned ancestor (`root`).

Therefore, the top-left corner of `root>plain>pin` renders at:
- x = 0 + 10 = 10
- y = 0 + 10 = 10

This matches the border box information provided (`@ x=10 y=10`), which confirms this reasoning.

ANSWER: 10,10
