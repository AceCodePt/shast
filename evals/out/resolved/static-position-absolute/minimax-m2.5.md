# static-position-absolute — opencode/minimax-m2.5

- arm: `resolved`
- probes: an absolutely positioned box with no offsets, which keeps its place
- expected: 50 — with all offsets `auto` the box stays at its static position, directly below the 50px spacer, rather than jumping to the top of the containing block
- parsed answer: `50`
- verdict: **PASS**
- elapsed: 6399ms

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

Since `floaty` is `position: absolute` with no offset properties set, it falls back to its static position—the place it would have occupied in normal flow. In the document flow, `spacer` fills 0–50px, so `floaty`'s static position is at y=50, which matches the reported coordinates.

ANSWER: 50
