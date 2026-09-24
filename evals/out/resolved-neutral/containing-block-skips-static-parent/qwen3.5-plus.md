# containing-block-skips-static-parent — opencode/qwen3.5-plus

- arm: `resolved`
- probes: which ancestor an absolutely positioned box resolves against
- expected: 10,10 — `root>plain` is static and is skipped, so the offsets are measured from the root's padding edge at 0,0, not from `root>plain` at 20,20
- parsed answer: `10,10`
- verdict: **PASS**
- elapsed: 21895ms

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

Looking at the rendered information provided:

The `root>plain>pin` element has `position: absolute` with `top: 10px, left: 10px`. Since `root>plain` is **not positioned** (static), the absolutely positioned `pin` element looks up the tree for the nearest positioned ancestor, which is `root` (with `position: relative`).

However, the question asks for the **actual rendered position**, which is explicitly given in the data. The `@` notation shows the border box position in CSS pixels from the top-left of the page, and for `root>plain>pin` it clearly states `x=10 y=10`.

ANSWER: 10,10
