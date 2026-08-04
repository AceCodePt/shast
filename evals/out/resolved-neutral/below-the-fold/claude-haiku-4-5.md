# below-the-fold — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: a node placed past the viewport's bottom edge
- expected: NO — it starts at y=700 in a 300px-tall viewport
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 7109ms

## Question

Is `root>footer` inside the area the viewer sees when the page first loads, before any scrolling?

## Context shown to the model


```
viewport 500x300
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root         div
  @ x=0 y=0 width=500 height=800
  = position: relative, height: 800px

root>top     div  "masthead"
  @ x=0 y=0 width=500 height=40
  = font-size: 16px (inherited), height: 40px

root>footer  div  "footer note"
  @ x=0 y=700 width=500 height=60  below-fold
  = font-size: 16px (inherited), position: absolute, top: 700px, left: 0px, width: 500px, height: 60px
```

## Model reply

Looking at the information provided:

The viewport is 500x300 pixels, which means the viewer can see from y=0 to y=300 when the page first loads.

The `root>footer` element is positioned at y=700 with a height of 60px, meaning it spans from y=700 to y=760.

Since the footer starts at y=700, which is well below the visible viewport area (0-300px), the footer is not visible when the page first loads. This is confirmed by the annotation "below-fold" in the provided information.

ANSWER: NO
