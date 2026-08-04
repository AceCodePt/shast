# fixed-ignores-positioned-parent — opencode/claude-haiku-4-5

- arm: `shot+dom`
- probes: a fixed box resolving against the viewport, not a positioned ancestor
- expected: 25,15 — a fixed box resolves against the viewport, so the positioned parent and its padding are both ignored
- parsed answer: `25,15`
- verdict: **PASS**
- elapsed: 7775ms
- attached: `page.png`

## Question

`root` is `position: relative` with 40px of padding, and `root>inner` is `position: fixed` with `top: 15px; left: 25px`. At what x,y does the top-left corner of `root>inner` render?

## Context shown to the model

![page.png](page.png)

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

Attached is a screenshot of the rendered page at 600x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

Looking at the browser data provided:

The `root>inner` element has `position: fixed` with `top: 15px` and `left: 25px`. A fixed positioned element is positioned relative to the viewport, not to its parent container. The `getBoundingClientRect()` data shows that the top-left corner of `root>inner` is at `x=25` and `y=15`.

The fact that `root` is `position: relative` with 40px padding is irrelevant for a fixed positioned child—fixed positioning removes the element from the normal document flow and positions it relative to the viewport. The padding on the parent does not affect where a fixed child is placed.

ANSWER: 25,15
