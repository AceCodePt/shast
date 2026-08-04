# unreachable-vs-scrollable — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: telling a box you scroll to apart from a box scrolling cannot reach
- expected: root>sideways — it runs 400px past the right edge, and pages do not scroll horizontally
- parsed answer: `root>sideways`
- verdict: **PASS**
- elapsed: 7671ms

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

Looking at the viewport and overflow information:

The viewport is 500x300 pixels. The page can only scroll vertically (normal web behavior), not horizontally. 

`root>lower` is positioned at `y=700`, which is below the initial viewport (0-300px). By scrolling down, a viewer can bring this element into view since vertical scrolling is possible.

`root>sideways` is positioned at `x=0 y=40` with a width of 900px. The element extends 400px past the right edge of the 500px viewport (900 - 500 = 400px). The note explicitly states "pages do not scroll horizontally," so there is no way to scroll right to bring the off-screen portion into view.

Therefore, `root>sideways` cannot be brought fully into view by ordinary scrolling, while `root>lower` can be reached by scrolling down.

ANSWER: root>sideways
