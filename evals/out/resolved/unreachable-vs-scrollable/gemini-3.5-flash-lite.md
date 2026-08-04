# unreachable-vs-scrollable — opencode/gemini-3.5-flash-lite

- arm: `resolved`
- probes: telling a box you scroll to apart from a box scrolling cannot reach
- expected: root>sideways — it runs 400px past the right edge, and pages do not scroll horizontally
- parsed answer: `root>sideways`
- verdict: **PASS**
- elapsed: 8710ms

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

Ordinary scrolling on web pages is vertical, which allows the viewer to scroll down and bring elements located below the fold, such as `root>lower`, into view. Conversely, web pages do not scroll horizontally, meaning elements extending past the right edge of the viewport like `root>sideways` cannot be reached through ordinary scrolling.

ANSWER: root>sideways
