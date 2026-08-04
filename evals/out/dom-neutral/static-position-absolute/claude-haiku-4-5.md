# static-position-absolute — opencode/claude-haiku-4-5

- arm: `dom`
- probes: an absolutely positioned box with no offsets, which keeps its place
- expected: 50 — with all offsets `auto` the box stays at its static position, directly below the 50px spacer, rather than jumping to the top of the containing block
- parsed answer: `50`
- verdict: **PASS**
- elapsed: 6871ms

## Question

`root>floaty` is `position: absolute` and declares no `top`, `right`, `bottom` or `left`. At what y does its top edge render?

## Context shown to the model


```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root         div
root>spacer  div  "spacer"
root>floaty  div  "floaty"

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=600 height=50
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 50px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: relative
  width: 600px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>spacer <div>
  getBoundingClientRect: x=0 y=0 width=600 height=50
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 50px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  width: 600px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>floaty <div>
  getBoundingClientRect: x=0 y=50 width=90 height=20
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 20px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  width: 90px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px
```

## Model reply

Looking at the bounding client rectangle data provided:

The `root>floaty` element has `getBoundingClientRect: x=0 y=50 width=90 height=20`. This directly tells us the rendered position of the element on screen.

The `y=50` value from `getBoundingClientRect()` represents the y-coordinate of the top edge of the element in viewport coordinates. This is the authoritative source for where the element actually renders, regardless of the CSS position property or lack of explicit positioning values.

When an absolutely positioned element doesn't declare `top`, `right`, `bottom`, or `left`, it uses its static position as a reference point. The static position would be where the element would have rendered in normal flow. Since the parent `root` is `position: relative` with height 50px, and the `floaty` element follows the `spacer` element in the DOM (which also has height 50px), the static position places it at y=50.

ANSWER: 50
