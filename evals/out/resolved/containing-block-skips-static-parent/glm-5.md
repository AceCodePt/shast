# containing-block-skips-static-parent — opencode/glm-5

- arm: `resolved`
- probes: which ancestor an absolutely positioned box resolves against
- expected: 10,10 — `root>plain` is static and is skipped, so the offsets are measured from the root's padding edge at 0,0, not from `root>plain` at 20,20
- parsed answer: `10,10`
- verdict: **PASS**
- elapsed: 16101ms

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

The report states `root>plain` has no `position` set, so it's `static` and cannot serve as the containing block for the absolutely-positioned `pin`. Instead, the containing block is the nearest positioned ancestor, `root` (`position: relative`). Absolute offsets are measured from the padding box of that containing block. `root`'s padding box starts at (0, 0) (border box with no border), so `top: 10px; left: 10px` places `pin` at (10, 10) — not relative to `plain`'s content box at (20+30, 20+30). This matches the measured box.

ANSWER: 10,10
