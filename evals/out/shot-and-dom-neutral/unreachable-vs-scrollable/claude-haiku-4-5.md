# unreachable-vs-scrollable — opencode/claude-haiku-4-5

- arm: `shot+dom`
- probes: telling a box you scroll to apart from a box scrolling cannot reach
- expected: root>sideways — it runs 400px past the right edge, and pages do not scroll horizontally
- parsed answer: `root>lower`
- verdict: **FAIL (answer-line slip or no reply)**
- elapsed: 9891ms
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

Looking at the data provided:

The viewport is 500x300 CSS pixels. The root container is 500 wide × 900 tall.

**root>sideways**: Located at y=40, width=900 (extends beyond the 500px viewport width). Since it extends horizontally beyond the viewport but sits within the scrollable vertical range of the root container, vertical scrolling can bring it into view.

**root>lower**: Located at y=700, width=400. It's positioned below y=300 (the viewport bottom), so vertical scrolling could theoretically reach it. However, the root container has a height of 900px with position: relative and overflow: visible. At y=700 with height 40, this node would be at y=740 at its bottom edge. This is within the scrollable range.

Wait, let me reconsider. The viewport height is 300px. The root is 900px tall. So scrolling can reach from y=0 to y=600 (when the bottom of the 900px container aligns with the viewport bottom). The **root>lower** element at y=700 extends to y=740, which means its top (y=700) is **below** the maximum scrollable position (y=600). Therefore, scrolling cannot bring root>lower fully into view.

The **root>sideways** element at y=40 is easily reachable by scrolling to that position.

ANSWER: root>lower
