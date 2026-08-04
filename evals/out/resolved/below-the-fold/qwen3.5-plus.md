# below-the-fold — opencode/qwen3.5-plus

- arm: `resolved`
- probes: a node placed past the viewport's bottom edge
- expected: NO — it starts at y=700 in a 300px-tall viewport
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 14590ms

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

The viewport is 500x300, meaning the visible area without scrolling spans from y=0 to y=300. The `root>footer` element is positioned at y=700 with height 60, placing it entirely below y=300. The report also explicitly marks it as "below-fold", confirming it's not in the initial visible area.

ANSWER: NO
