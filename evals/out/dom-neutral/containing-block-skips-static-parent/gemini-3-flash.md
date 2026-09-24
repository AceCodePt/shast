# containing-block-skips-static-parent — opencode/gemini-3-flash

- arm: `dom`
- probes: which ancestor an absolutely positioned box resolves against
- expected: 10,10 — `root>plain` is static and is skipped, so the offsets are measured from the root's padding edge at 0,0, not from `root>plain` at 20,20
- parsed answer: `10,10`
- verdict: **PASS**
- elapsed: 12647ms

## Question

At what x,y does the top-left corner of `root>plain>pin` render? Note that `root>plain` is not positioned.

## Context shown to the model


```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root            div
root>plain      div
root>plain>pin  div  "pinned"

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=600 height=100
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 100px
  left: 0px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: relative
  top: 0px
  width: 600px
  z-index: auto
  padding: 20px 20px 20px 20px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>plain <div>
  getBoundingClientRect: x=20 y=20 width=560 height=60
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 60px
  left: auto
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  top: auto
  width: 560px
  z-index: auto
  padding: 30px 30px 30px 30px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>plain>pin <div>
  getBoundingClientRect: x=10 y=10 width=80 height=20
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 20px
  left: 10px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  top: 10px
  width: 80px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px
```

## Model reply

The `root>plain>pin` element is `position: absolute` with `top: 10px` and `left: 10px`. Since its immediate parent `root>plain` is `position: static`, it is positioned relative to its nearest positioned ancestor, which is `root` (`position: relative`). Given that `root` starts at `x=0, y=0` with no border, the offsets are applied directly from the `root` origin, resulting in a render position of `x=10, y=10`, as confirmed by the browser's `getBoundingClientRect` data for the node.

ANSWER: 10,10
