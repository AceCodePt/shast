# partial-cover — opencode/gemini-3-flash

- arm: `shot+dom`
- probes: a coverer that overlaps a box but misses its text hides nothing readable
- expected: NO — the chip sits to the right of and below the text line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 12046ms
- attached: `page.png`

## Question

`root>chip` paints over part of `root>row`. Is any of `root>row`'s own text hidden by it?

## Context shown to the model

![page.png](page.png)

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

Attached is a screenshot of the rendered page at 600x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

The `root>row` element occupies the full width of the viewport (x=0 to 600), and its text "Short label" starts at x=4 due to the 4px padding. The `root>chip` element is positioned absolutely starting at x=400. Since "Short label" at a 16px font size is much shorter than 400 pixels (typically ending before x=120), the chip does not overlap the area where the text is rendered.

ANSWER: NO
