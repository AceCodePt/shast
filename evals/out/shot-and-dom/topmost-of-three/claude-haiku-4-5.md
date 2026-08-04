# topmost-of-three — opencode/claude-haiku-4-5

- arm: `shot+dom`
- probes: paint order across three overlapping boxes at one point
- expected: root>middle (z-index 3, all three in the root context)
- parsed answer: `root>middle`
- verdict: **PASS**
- elapsed: 8280ms
- attached: `page.png`

## Question

All three boxes overlap the point 120,120. Which one does a viewer actually see at that point?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 500x400

root         div
root>back    div
root>middle  div
root>front   div

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=500 height=300
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 300px
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

root>back <div>
  getBoundingClientRect: x=40 y=40 width=200 height=200
  background-color: rgb(17, 17, 17)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 200px
  left: 40px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  top: 40px
  width: 200px
  z-index: 1
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>middle <div>
  getBoundingClientRect: x=80 y=80 width=200 height=200
  background-color: rgb(34, 34, 34)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 200px
  left: 80px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  top: 80px
  width: 200px
  z-index: 3
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>front <div>
  getBoundingClientRect: x=100 y=100 width=60 height=60
  background-color: rgb(51, 51, 51)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 60px
  left: 100px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  top: 100px
  width: 60px
  z-index: 2
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

Attached is a screenshot of the rendered page at 500x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

Looking at the z-index values and bounding rectangles:

- **root>back**: z-index: 1, positioned at (40, 40) with size 200x200
- **root>middle**: z-index: 3, positioned at (80, 80) with size 200x200
- **root>front**: z-index: 2, positioned at (100, 100) with size 60x60

The point (120, 120) falls within all three boxes:
- root>back: x range [40, 240], y range [40, 240] ✓
- root>middle: x range [80, 280], y range [80, 280] ✓
- root>front: x range [100, 160], y range [100, 160] ✓

When elements overlap, the one with the highest z-index is rendered on top and visible to the viewer. Among the three boxes, root>middle has z-index: 3, which is the highest. Therefore, a viewer sees root>middle at point (120, 120).

ANSWER: root>middle
