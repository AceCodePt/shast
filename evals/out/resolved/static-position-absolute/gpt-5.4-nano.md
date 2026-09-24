# static-position-absolute — opencode/gpt-5.4-nano

- arm: `resolved`
- probes: an absolutely positioned box with no offsets, which keeps its place
- expected: 50 — with all offsets `auto` the box stays at its static position, directly below the 50px spacer, rather than jumping to the top of the containing block
- parsed answer: `50`
- verdict: **PASS**
- elapsed: 10330ms

## Question

`root>floaty` is `position: absolute` and declares no `top`, `right`, `bottom` or `left`. At what y does its top edge render?

## Context shown to the model


```
viewport 600x400
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root         div
  @ x=0 y=0 width=600 height=50  overflows
  = position: relative
  ! overflows: content is 600x70px inside a 600x50px content box, so it is painted outside the box rather than cut off (overflow is visible)

root>spacer  div  "spacer"
  @ x=0 y=0 width=600 height=50
  = font-size: 16px (inherited), height: 50px

root>floaty  div  "floaty"
  @ x=0 y=50 width=90 height=20
  = font-size: 16px (inherited), position: absolute, width: 90px, height: 20px
```

## Model reply

Because `root>floaty` is `position: absolute` with no `top/right/bottom/left`, the renderer uses its “static position” as the reference point for where it would have appeared in normal document flow. In the measured report, the border box for `root>floaty` is given as `x=0 y=50` with `height=20`, so its top edge renders at `y = 50` CSS pixels.

ANSWER: 50
