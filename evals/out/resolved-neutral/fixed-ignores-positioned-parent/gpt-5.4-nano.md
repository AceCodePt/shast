# fixed-ignores-positioned-parent — opencode/gpt-5.4-nano

- arm: `resolved`
- probes: a fixed box resolving against the viewport, not a positioned ancestor
- expected: 25,15 — a fixed box resolves against the viewport, so the positioned parent and its padding are both ignored
- parsed answer: `25,15`
- verdict: **PASS**
- elapsed: 8452ms

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

`position: fixed` elements are positioned relative to the viewport (the initial containing block), not relative to the parent’s padding or coordinate system. The render output explicitly gives the resolved border-box position for `root>inner` as `@ x=25 y=15`. Therefore its top-left corner on the page is at those absolute coordinates.

ANSWER: 25,15
