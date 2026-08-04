# static-position-absolute — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: an absolutely positioned box with no offsets, which keeps its place
- expected: 50 — with all offsets `auto` the box stays at its static position, directly below the 50px spacer, rather than jumping to the top of the containing block
- parsed answer: `50`
- verdict: **PASS**
- elapsed: 6830ms

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

Looking at the report, the `root>floaty` element is positioned absolutely but has no explicit `top`, `right`, `bottom`, or `left` properties declared.

According to CSS positioning rules, when an absolutely positioned element has no offset properties specified, it renders at the position it would have occupied in the normal flow. Since `root>floaty` appears after `root>spacer` (which has height 50px and is at y=0), the floaty element would naturally follow at y=50 in the normal document flow.

The report confirms this: the border box shows `@ x=0 y=50 width=90 height=20`, meaning the top edge of `root>floaty` renders at y=50.

ANSWER: 50
