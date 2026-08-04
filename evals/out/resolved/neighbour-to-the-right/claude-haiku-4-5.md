# neighbour-to-the-right — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: reconstructing a two-column reading order from boxes alone
- expected: root>rightBottom
- parsed answer: `root>rightBottom`
- verdict: **PASS**
- elapsed: 6680ms

## Question

The four boxes form a two-by-two arrangement. Which node sits directly to the right of `root>leftBottom`, on the same row?

## Context shown to the model


```
viewport 800x400
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root              div
  @ x=0 y=0 width=800 height=300
  = position: relative, height: 300px

root>leftTop      div  "left top"
  @ x=0 y=0 width=300 height=80
  = font-size: 16px (inherited), position: absolute, top: 0px, left: 0px, width: 300px, height: 80px

root>rightTop     div  "right top"
  @ x=340 y=0 width=300 height=80
  = font-size: 16px (inherited), position: absolute, top: 0px, left: 340px, width: 300px, height: 80px

root>leftBottom   div  "left bottom"
  @ x=0 y=120 width=300 height=80
  = font-size: 16px (inherited), position: absolute, top: 120px, left: 0px, width: 300px, height: 80px

root>rightBottom  div  "right bottom"
  @ x=340 y=120 width=300 height=80
  = font-size: 16px (inherited), position: absolute, top: 120px, left: 340px, width: 300px, height: 80px
```

## Model reply

Looking at the report, I need to identify which box is on the same row as `root>leftBottom` and positioned to its right.

From the measurements:
- `root>leftBottom` is at y=120 (vertical position) and x=0, with width=300
- `root>rightBottom` is at y=120 (same vertical position) and x=340

Since both boxes share the same y-coordinate of 120, they are on the same row. The `root>rightBottom` box is positioned to the right of `root>leftBottom` (at x=340, which is further right than x=0).

ANSWER: root>rightBottom
