# partial-cover — opencode/gpt-5.4-nano

- arm: `dom`
- probes: a coverer that overlaps a box but misses its text hides nothing readable
- expected: NO — the chip sits to the right of and below the text line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 10545ms

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

`root>row` is a normal-flow `<p>` with a bounding box from `y=0` to `y=120`. `root>chip` is an absolutely positioned `<div>` painted on top, with a box from `y=60` to `y=100` and `x=400` to `x=560`, so it overlaps the *area* of the `<p>` in the middle.

However, `root>row`’s only text is `"Short label"` (single line), and the `<p>` has only `padding: 4px` with no evidence of vertical centering or extra lines; that text would render near the top of the `<p>` (around `y≈4` onward), not down in `y=60..100`. Since the chip’s overlap region is below where that text would appear, none of the row’s own text is hidden.

ANSWER: NO
