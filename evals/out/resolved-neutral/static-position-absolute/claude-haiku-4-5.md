# static-position-absolute — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: an absolutely positioned box with no offsets, which keeps its place
- expected: 50 — with all offsets `auto` the box stays at its static position, directly below the 50px spacer, rather than jumping to the top of the containing block
- parsed answer: `50`
- verdict: **PASS**
- elapsed: 8180ms

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

Looking at the information provided:

The `root>floaty` element has `position: absolute` but no explicit `top`, `right`, `bottom`, or `left` properties. According to CSS positioning rules, when an absolutely positioned element has no offset properties specified, it renders at its "static position" — which is where it would have appeared in the normal document flow if it weren't absolutely positioned.

From the layout information, `root>floaty` has `@ x=0 y=50`, which tells us its border box starts at y=50. The y-coordinate in the @ notation represents the absolute position from the top of the page, and for an absolutely positioned element with no offset properties, this position is determined by its static position in the normal flow.

Since the element is positioned after the spacer (which occupies y=0 to y=50), and the floaty element itself has a height of 20px, its top edge renders at y=50.

ANSWER: 50
