# unreachable-vs-scrollable — opencode/glm-5

- arm: `dom`
- probes: telling a box you scroll to apart from a box scrolling cannot reach
- expected: root>sideways — it runs 400px past the right edge, and pages do not scroll horizontally
- parsed answer: `root>sideways`
- verdict: **PASS**
- elapsed: 89224ms

## Question

Both `root>lower` and `root>sideways` sit outside the area first shown. Only one of them can be brought into view by ordinary scrolling. Which node can the viewer NOT reach that way?

## Context shown to the model


```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 500x300

root           div
root>lower     div  "further down"
root>sideways  div  "runs off sideways"

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=500 height=900
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 900px
  left: 0px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: relative
  top: 0px
  width: 500px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>lower <div>
  getBoundingClientRect: x=0 y=700 width=400 height=40
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 40px
  left: 0px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  top: 700px
  width: 400px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>sideways <div>
  getBoundingClientRect: x=0 y=40 width=900 height=40
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 40px
  left: 0px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  top: 40px
  width: 900px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px
```

## Model reply

Reasoning: The viewport is 500×300. `root>lower` (y=700, 400×40) sits below the initial view, but the root document is 900px tall, so scrolling vertically down to ~y=600 puts the lower div fully inside the viewport. `root>sideways` is 900px wide while the viewport is only 500px wide; even though horizontal scrolling can reveal parts of it, an element wider than the viewport can never be brought *fully* into view at once. Thus the sideways node is the one ordinary scrolling cannot fully reveal.

ANSWER: root>sideways
