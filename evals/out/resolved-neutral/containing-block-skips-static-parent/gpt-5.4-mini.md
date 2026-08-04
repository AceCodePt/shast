# containing-block-skips-static-parent — opencode/gpt-5.4-mini

- arm: `resolved`
- probes: which ancestor an absolutely positioned box resolves against
- expected: 10,10 — `root>plain` is static and is skipped, so the offsets are measured from the root's padding edge at 0,0, not from `root>plain` at 20,20
- parsed answer: `30,30`
- verdict: **FAIL (misread)**
- elapsed: 9997ms

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

`root>plain>pin` is `position: absolute`, and `root>plain` is not positioned, so its containing block is the nearest positioned ancestor: `root`.  
For a relatively positioned element with `padding: 20px`, the padding box starts at `(20,20)` from the page origin. Adding `top: 10px` and `left: 10px` places the pinned box at `(30,30)`.

ANSWER: 30,30
