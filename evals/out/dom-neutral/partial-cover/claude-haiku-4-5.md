# partial-cover — opencode/claude-haiku-4-5

- arm: `dom`
- probes: a coverer that overlaps a box but misses its text hides nothing readable
- expected: NO — the chip sits to the right of and below the text line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 7638ms

## Question

`root>chip` paints over part of `root>row`. Is any of `root>row`'s own text hidden by it?

## Context shown to the model


```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root       div
root>row   p    "Short label"
root>chip  div  "chip"

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=600 height=300
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
  width: 600px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>row <p>
  getBoundingClientRect: x=0 y=0 width=600 height=120
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 120px
  left: auto
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  top: auto
  width: 600px
  z-index: auto
  padding: 4px 4px 4px 4px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>chip <div>
  getBoundingClientRect: x=400 y=60 width=160 height=40
  background-color: rgb(255, 204, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 40px
  left: 400px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  top: 60px
  width: 160px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px
```

## Model reply

Looking at the bounding rectangles:

- `root>row` (the `<p>` element) occupies: x=0 to x=600, y=0 to y=120
- `root>chip` (the `<div>` element) occupies: x=400 to x=560, y=60 to y=100

The chip's bounding box (x=400 to x=560, y=60 to y=100) overlaps with the row's bounding box in the region x=400 to x=560, y=60 to y=100.

However, the key question is whether `root>row`'s own text is hidden. The text "Short label" is in the `<p>` element. Without knowing the exact horizontal and vertical positioning of where that text is rendered within the `<p>`'s 600x120 box, we cannot definitively say the text is hidden just from the bounding rectangles. The text could be positioned in the upper-left portion of the `<p>` (e.g., y=0 to y=19.2 based on line-height), which would not overlap with the chip at y=60 to y=100.

Given that the chip starts at y=60 and the text likely renders near the top of the paragraph (within the first line-height of ~19.2px), the text would likely not be hidden by the chip.

ANSWER: NO
