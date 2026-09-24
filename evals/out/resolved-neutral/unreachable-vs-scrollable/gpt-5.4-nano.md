# unreachable-vs-scrollable — opencode/gpt-5.4-nano

- arm: `resolved`
- probes: telling a box you scroll to apart from a box scrolling cannot reach
- expected: root>sideways — it runs 400px past the right edge, and pages do not scroll horizontally
- parsed answer: `root>sideways`
- verdict: **PASS**
- elapsed: 7679ms

## Question

Both `root>lower` and `root>sideways` sit outside the area first shown. Only one of them can be brought into view by ordinary scrolling. Which node can the viewer NOT reach that way?

## Context shown to the model


```
viewport 500x300
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root           div
  @ x=0 y=0 width=500 height=900  overflows
  = position: relative, height: 900px
  ! overflows: content is 900x740px inside a 500x900px content box, so it is painted outside the box rather than cut off (overflow is visible)

root>lower     div  "further down"
  @ x=0 y=700 width=400 height=40  below-fold
  = font-size: 16px (inherited), position: absolute, top: 700px, left: 0px, width: 400px, height: 40px

root>sideways  div  "runs off sideways"
  @ x=0 y=40 width=900 height=40  offscreen
  = font-size: 16px (inherited), position: absolute, top: 40px, left: 0px, width: 900px, height: 40px
  ! offscreen: 400px past the right edge (pages do not scroll horizontally); viewport is 500x300
```

## Model reply

`root>lower` is positioned at `y=700` with width `400`, so it lies below the initial `500x300` viewport. Ordinary scrolling (vertical) can move the page down until that `y=700` region is within the viewport, bringing the whole `400px`-wide element into view.

`root>sideways` sits at `top=40` but has `width=900`, meaning it extends `400px` past the right edge of the viewport (`500px` wide). Since pages do not scroll horizontally, vertical scrolling cannot shift it into fully visible range.

ANSWER: root>sideways
