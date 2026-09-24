# fixed-ignores-positioned-parent — opencode/glm-5

- arm: `dom`
- probes: a fixed box resolving against the viewport, not a positioned ancestor
- expected: 25,15 — a fixed box resolves against the viewport, so the positioned parent and its padding are both ignored
- parsed answer: `25,15`
- verdict: **PASS**
- elapsed: 26018ms

## Question

`root` is `position: relative` with 40px of padding, and `root>inner` is `position: fixed` with `top: 15px; left: 25px`. At what x,y does the top-left corner of `root>inner` render?

## Context shown to the model


```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root        div
root>inner  div  "fixed"

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=600 height=80
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 80px
  left: 0px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: relative
  top: 0px
  width: 600px
  z-index: auto
  padding: 40px 40px 40px 40px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>inner <div>
  getBoundingClientRect: x=25 y=15 width=70 height=20
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 20px
  left: 25px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: fixed
  top: 15px
  width: 70px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px
```

## Model reply

For `position: fixed`, the element is positioned relative to the viewport (the initial containing block), not relative to its containing parent's padding box. This means the 40px of padding on `root` has no effect on `root>inner`'s placement — the `top: 15px` and `left: 25px` are measured from the viewport's top-left corner directly. This is confirmed by the computed `left: 25px` and `top: 15px` values, as well as `getBoundingClientRect` showing `x=25, y=15`.

ANSWER: 25,15
