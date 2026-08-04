# below-the-fold — opencode/qwen3.5-plus

- arm: `resolved`
- probes: a node placed past the viewport's bottom edge
- expected: NO — it starts at y=700 in a 300px-tall viewport
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 10017ms

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

The viewport is 500x300 pixels, meaning the visible area extends from y=0 to y=300 when the page first loads. The `root>footer` element is positioned at y=700 with height 60, placing it from y=700 to y=760. Since y=700 is well below the viewport's bottom edge at y=300, the footer is not visible without scrolling. This is also explicitly indicated by the "below-fold" marker in the data.

ANSWER: NO
