# containing-block-skips-static-parent — opencode/glm-5

- arm: `resolved`
- probes: which ancestor an absolutely positioned box resolves against
- expected: 10,10 — `root>plain` is static and is skipped, so the offsets are measured from the root's padding edge at 0,0, not from `root>plain` at 20,20
- parsed answer: `10,10`
- verdict: **PASS**
- elapsed: 33035ms

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

## Reasoning

The element `root>plain>pin` has `position: absolute` with `top: 10px` and `left: 10px`. The key point is that `root>plain` (its DOM parent) is **not positioned**, so it is skipped when establishing the containing block. The containing block falls back to the nearest positioned ancestor, which is `root` (it has `position: relative`).

For an absolutely positioned element, the containing block is the **padding box** of that positioned ancestor. `root`'s border box is at x=0, y=0 with no border, so its padding box origin is also at x=0, y=0. Thus `top: 10px; left: 10px` resolves to an offset of (10, 10) from that origin, yielding x=10, y=10. This matches the rendered `@` coordinates.

ANSWER: 10,10
