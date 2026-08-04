# containing-block-skips-static-parent — opencode/gemini-3.5-flash-lite

- arm: `resolved`
- probes: which ancestor an absolutely positioned box resolves against
- expected: 10,10 — `root>plain` is static and is skipped, so the offsets are measured from the root's padding edge at 0,0, not from `root>plain` at 20,20
- parsed answer: `30,30`
- verdict: **FAIL (misread)**
- elapsed: 21183ms

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

Since `root>plain` is not positioned, the nearest positioned ancestor for `root>plain>pin` is `root`. The `root` element has `position: relative` and a padding of 20px, meaning its padding box starts at x = 20, y = 20 relative to the page. With `top: 10px` and `left: 10px`, `root>plain>pin` is offset by 10px from `root`'s padding box origin, placing its top-left corner at x = 20 + 10 = 30 and y = 20 + 10 = 30.

ANSWER: 30,30
