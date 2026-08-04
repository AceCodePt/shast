# containing-block-skips-static-parent — opencode/minimax-m2.5

- arm: `resolved`
- probes: which ancestor an absolutely positioned box resolves against
- expected: 10,10 — `root>plain` is static and is skipped, so the offsets are measured from the root's padding edge at 0,0, not from `root>plain` at 20,20
- parsed answer: `10,10`
- verdict: **PASS**
- elapsed: 9637ms

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

The `pin` element has `position: absolute`, so its containing block is the nearest **positioned** ancestor. `root>plain` is not positioned, so it doesn't form a containing block — instead, `root` (which is `position: relative`) does.

For absolute positioning, offsets are measured from the padding edge of the containing block. `root` has no border, so its padding edge coincides with its border edge at (0, 0). Therefore `top: 10px` and `left: 10px` place the pin's top-left at (0 + 10, 0 + 10) = (10, 10). The bounding box confirms this. `root>plain`'s padding is irrelevant because it's not positioned.

ANSWER: 10,10
