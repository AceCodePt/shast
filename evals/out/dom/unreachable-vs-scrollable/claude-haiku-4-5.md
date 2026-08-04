# unreachable-vs-scrollable — opencode/claude-haiku-4-5

- arm: `dom`
- probes: telling a box you scroll to apart from a box scrolling cannot reach
- expected: root>sideways — it runs 400px past the right edge, and pages do not scroll horizontally
- parsed answer: `root>sideways`
- verdict: **PASS**
- elapsed: 9117ms

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

Let me analyze the viewport and positioning data:

The viewport is 500x300 (width × height).

**root>sideways**: 
- Positioned at `top: 40px`, `left: 0px`
- Dimensions: 900 width × 40 height
- Vertically within view (40px down, well within 300px viewport height)
- Horizontally extends to 900px, but viewport is only 500px wide
- Can be brought into view by **horizontal scrolling** (not ordinary vertical scrolling)

**root>lower**:
- Positioned at `top: 700px`, `left: 0px`
- Dimensions: 400 width × 40 height
- Vertically positioned at 700px, which is beyond the initial 300px viewport
- Can be brought into view by **vertical scrolling** (ordinary scrolling down)

The question asks which node cannot be reached by "ordinary scrolling" — which typically means vertical scrolling in a web context.

`root>sideways` requires horizontal scrolling to bring into view (its content extends 900px horizontally but the viewport is only 500px wide). While it's already at a visible vertical position, the horizontal overflow means it cannot be fully brought into view by vertical scrolling alone.

`root>lower` can be brought fully into view simply by scrolling down (vertical/ordinary scrolling).

ANSWER: root>sideways
