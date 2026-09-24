# static-position-absolute — opencode/gemini-3.5-flash-lite

- arm: `shot+dom`
- probes: an absolutely positioned box with no offsets, which keeps its place
- expected: 50 — with all offsets `auto` the box stays at its static position, directly below the 50px spacer, rather than jumping to the top of the containing block
- parsed answer: `50`
- verdict: **PASS**
- elapsed: 7731ms
- attached: `page.png`

## Question

`root>floaty` is `position: absolute` and declares no `top`, `right`, `bottom` or `left`. At what y does its top edge render?

## Context shown to the model

![page.png](page.png)

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

Attached is a screenshot of the rendered page at 600x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

According to the browser's `getBoundingClientRect` data for `root>floaty`, the top edge (`y`) is located at 50 CSS pixels. An absolutely positioned element with no offset properties specified is placed at its static position in the normal flow, immediately following the preceding `spacer` element.

ANSWER: 50
