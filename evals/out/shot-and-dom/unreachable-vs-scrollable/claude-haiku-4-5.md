# unreachable-vs-scrollable — opencode/claude-haiku-4-5

- arm: `shot+dom`
- probes: telling a box you scroll to apart from a box scrolling cannot reach
- expected: root>sideways — it runs 400px past the right edge, and pages do not scroll horizontally
- parsed answer: `root>sideways`
- verdict: **PASS**
- elapsed: 7792ms
- attached: `page.png`

## Question

Both `root>lower` and `root>sideways` sit outside the area first shown. Only one of them can be brought into view by ordinary scrolling. Which node can the viewer NOT reach that way?

## Context shown to the model

![page.png](page.png)

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

Attached is a screenshot of the rendered page at 500x300 CSS px, at 1 device pixel per CSS px.
```

## Model reply

Looking at the layout information provided:

**Viewport dimensions:** 500x300 CSS px

**root>lower:** 
- Position: y=700, height=40
- Extends from y=700 to y=740
- This is below the initial viewport (0-300), so scrolling down can bring it into view

**root>sideways:**
- Position: x=0, width=900, height=40
- Extends from x=0 to x=900 horizontally
- The viewport is only 500px wide
- While the element starts at x=0 (in view), it extends to x=900, running 400px beyond the right edge of the viewport
- Ordinary scrolling is vertical (up/down), not horizontal

The key insight is that `root>lower` sits below the viewport and can be brought fully into view by scrolling vertically downward. However, `root>sideways` runs off the right side of the viewport horizontally. Since "ordinary scrolling" refers to vertical scrolling in the context of a 500px-wide viewport, you cannot scroll horizontally to bring the overflow into view through normal scrolling behavior.

ANSWER: root>sideways
