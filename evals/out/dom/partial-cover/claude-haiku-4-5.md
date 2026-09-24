# partial-cover — opencode/claude-haiku-4-5

- arm: `dom`
- probes: a coverer that overlaps a box but misses its text hides nothing readable
- expected: NO — the chip sits to the right of and below the text line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 9812ms

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

Let me analyze the positioning and dimensions of these two elements:

**root>row (the `<p>` element):**
- Positioned at x=0, y=0
- Width: 600px, Height: 120px
- So it occupies the rectangle from (0,0) to (600,120)

**root>chip (the `<div>` element):**
- Positioned at x=400, y=60
- Width: 160px, Height: 40px
- So it occupies the rectangle from (400,60) to (560,100)

The chip element is positioned absolutely at coordinates (400, 60) with dimensions 160x40, which means it spans from x=400 to x=560 and y=60 to y=100.

The row element spans the full width (0-600) and height (0-120), so the chip's bounding box (400-560, 60-100) is entirely within the row's area. However, the row's text ("Short label") is rendered as the text content of the `<p>` element. Since we don't have specific information about where that text is positioned within the `<p>` element, and given that the `<p>` has padding of 4px on all sides and a height of 120px, the text would typically be positioned near the top of the element. The chip is positioned at y=60, which is well below where the text would naturally render (likely in the first ~20-30px of the paragraph), so the chip would not overlap the actual text.

ANSWER: NO
