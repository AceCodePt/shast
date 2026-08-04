# union-coverage — opencode/qwen3.5-plus

- arm: `dom`
- probes: two coverers that hide half a line each; neither alone would hide it
- expected: NO — together the two cover the whole line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 24030ms

## Question

Can a viewer read the words in `root>line`? Note that neither covering box on its own spans the whole line.

## Context shown to the model


```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 400x300

root            div
root>line       div  "Hidden by two"
root>leftHalf   div
root>rightHalf  div

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=400 height=200
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 200px
  left: 0px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: relative
  top: 0px
  width: 400px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>line <div>
  getBoundingClientRect: x=0 y=0 width=400 height=19.1875
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 19.1875px
  left: auto
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  top: auto
  width: 400px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>leftHalf <div>
  getBoundingClientRect: x=0 y=0 width=70 height=20
  background-color: rgb(16, 16, 16)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 20px
  left: 0px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  top: 0px
  width: 70px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>rightHalf <div>
  getBoundingClientRect: x=60 y=0 width=80 height=20
  background-color: rgb(32, 32, 32)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 20px
  left: 60px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  top: 0px
  width: 80px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px
```

## Model reply

Looking at the positioning data:

1. `root>line` contains the text "Hidden by two" and spans x=0 to x=400 at y=0 with height ~19px
2. `root>leftHalf` is absolutely positioned at x=0, covering width 70px (x=0 to x=70)
3. `root>rightHalf` is absolutely positioned at x=60, covering width 80px (x=60 to x=140)

Both `leftHalf` and `rightHalf` appear after `line` in the DOM tree and have opaque dark backgrounds (rgb(16,16,16) and rgb(32,32,32)). Since they are later siblings with absolute positioning, they render on top of `line`. Together they cover from x=0 to x=140. The text color is black (rgb(0,0,0)), which would have extremely poor contrast against these very dark backgrounds. The element is literally named "Hidden by two" indicating it's meant to be obscured by the two overlay boxes.

ANSWER: NO
