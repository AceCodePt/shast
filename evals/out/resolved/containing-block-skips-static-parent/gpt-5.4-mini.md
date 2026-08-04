# containing-block-skips-static-parent — opencode/gpt-5.4-mini

- arm: `resolved`
- probes: which ancestor an absolutely positioned box resolves against
- expected: 10,10 — `root>plain` is static and is skipped, so the offsets are measured from the root's padding edge at 0,0, not from `root>plain` at 20,20
- parsed answer: `30,30`
- verdict: **FAIL (misread)**
- elapsed: 9358ms

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

`root>plain>pin` is absolutely positioned, but `root>plain` is not positioned, so it does not establish the containing block. The nearest positioned ancestor is `root`, which is `position: relative`. For absolute positioning, `top: 10px` and `left: 10px` are measured from `root`’s padding box, which starts at `20,20`.

So the top-left corner renders at `30,30`.

ANSWER: 30,30
