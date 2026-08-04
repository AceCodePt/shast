# unreachable-vs-scrollable — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: telling a box you scroll to apart from a box scrolling cannot reach
- expected: root>sideways — it runs 400px past the right edge, and pages do not scroll horizontally
- parsed answer: `root>sideways`
- verdict: **PASS**
- elapsed: 10192ms

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

Let me analyze the layout report:

The viewport is 500x300 px. The root element has height 900px and position relative, so it creates a scrollable container vertically.

**root>lower**: positioned at y=700, width=400, height=40
- It's below the initial fold (y=700 is beyond the 300px viewport height)
- It's within the horizontal bounds (x=0 to x=400, which fits in the 500px viewport width)
- By scrolling down, you can bring this into view since the root element can scroll vertically to 900px total height

**root>sideways**: positioned at y=40, width=900, height=40
- It's just below the initial fold (y=40 is within the 300px viewport)
- The report explicitly states it's "offscreen: 400px past the right edge"
- The width is 900px, so it extends from x=0 to x=900
- The viewport is only 500px wide, and "pages do not scroll horizontally"
- You cannot reach this by scrolling because the page doesn't scroll horizontally

Since the page can only scroll vertically (the viewport height is 300px and root height is 900px), you can scroll down to reach `root>lower`. However, `root>sideways` extends 400px beyond the right edge of the viewport, and since there's no horizontal scrolling capability, you cannot bring it fully into view through ordinary scrolling.

ANSWER: root>sideways
