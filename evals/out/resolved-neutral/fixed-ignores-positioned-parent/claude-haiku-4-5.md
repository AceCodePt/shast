# fixed-ignores-positioned-parent — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: a fixed box resolving against the viewport, not a positioned ancestor
- expected: 25,15 — a fixed box resolves against the viewport, so the positioned parent and its padding are both ignored
- parsed answer: `25,15`
- verdict: **PASS**
- elapsed: 7298ms

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

Looking at the provided information:

The `root>inner` element has `position: fixed` with `top: 15px` and `left: 25px`. The key insight is that `position: fixed` positions elements relative to the **viewport**, not relative to any parent element, regardless of whether the parent has `position: relative` or padding.

The `top: 15px` means 15px down from the top of the viewport, and `left: 25px` means 25px from the left edge of the viewport. The parent's `position: relative` and `40px padding` do not affect the positioning of a fixed element.

The rendered box information confirms this: `root>inner` is shown at `x=25 y=15`, which matches exactly the `left: 25px` and `top: 15px` values.

ANSWER: 25,15
