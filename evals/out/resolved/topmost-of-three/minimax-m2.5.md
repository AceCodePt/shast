# topmost-of-three — opencode/minimax-m2.5

- arm: `resolved`
- probes: paint order across three overlapping boxes at one point
- expected: root>middle (z-index 3, all three in the root context)
- parsed answer: `root>middle`
- verdict: **PASS**
- elapsed: 5633ms

## Question

All three boxes overlap the point 120,120. Which one does a viewer actually see at that point?

## Context shown to the model


```
viewport 500x400
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root         div
  @ x=0 y=0 width=500 height=300
  = position: relative, height: 300px

root>back    div
  @ x=40 y=40 width=200 height=200  covered
  = position: absolute, top: 40px, left: 40px, width: 200px, height: 200px, z-index: 1, background-color: #111111
  ! covered: root>front <div> (absolute, z-index 2) paints later than this node, with an opaque background, over 9% of the box
  ! covered: root>middle <div> (absolute, z-index 3) paints later than this node, with an opaque background, over 64% of the box

root>middle  div
  @ x=80 y=80 width=200 height=200
  = position: absolute, top: 80px, left: 80px, width: 200px, height: 200px, z-index: 3, background-color: #222222

root>front   div
  @ x=100 y=100 width=60 height=60  covered
  = position: absolute, top: 100px, left: 100px, width: 60px, height: 60px, z-index: 2, background-color: #333333
  ! covered: root>middle <div> (absolute, z-index 3) paints later than this node, with an opaque background, over 100% of the box
```

## Model reply

The three boxes stack by z-index: middle (3) > front (2) > back (1). The report explicitly states that `root>front` is 100% covered by `root>middle`, so front is not visible at (120,120). Middle paints on top of both front and back at that point, so it is what the viewer sees.

ANSWER: root>middle
