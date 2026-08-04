# fixed-ignores-positioned-parent — opencode/glm-5

- arm: `resolved`
- probes: a fixed box resolving against the viewport, not a positioned ancestor
- expected: 25,15 — a fixed box resolves against the viewport, so the positioned parent and its padding are both ignored
- parsed answer: `25,15`
- verdict: **PASS**
- elapsed: 17838ms

## Question

`root` is `position: relative` with 40px of padding, and `root>inner` is `position: fixed` with `top: 15px; left: 25px`. At what x,y does the top-left corner of `root>inner` render?

## Context shown to the model


```
viewport 600x400
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root        div
  @ x=0 y=0 width=600 height=80
  = position: relative, padding: 40px

root>inner  div  "fixed"
  @ x=25 y=15 width=70 height=20
  = font-size: 16px (inherited), position: fixed, top: 15px, left: 25px, width: 70px, height: 20px
```

## Model reply

The top-left corner of `root>inner` renders at **x=25, y=15**.

Here's the reasoning: A `position: fixed` element is positioned relative to the **viewport** (the initial containing block), not relative to its nearest positioned ancestor. This is different from `position: absolute`, which would be offset relative to the padding box of the nearest positioned ancestor (the padded `root` box). Since `root>inner` is `fixed`, its `top: 15px` and `left: 25px` are measured from the viewport's top-left corner, regardless of `root`'s `position: relative` or its 40px padding. The rendered box confirms this: x=25, y=15.

ANSWER: 25,15
