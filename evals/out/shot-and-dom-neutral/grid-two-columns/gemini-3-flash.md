# grid-two-columns — opencode/gemini-3-flash

- arm: `shot+dom`
- probes: grid track placement with a gap
- expected: 220 — the first 200px track ends at x=200 and the 20px gap pushes the second track to x=220
- parsed answer: `220`
- verdict: **PASS**
- elapsed: 8746ms
- attached: `page.png`

## Question

`root` is `display: grid` with `grid-template-columns: 200px 300px` and `gap: 20px`. At what x does `root>right`'s left edge render?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root        div
root>left   div  "left"
root>right  div  "right"

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=600 height=19.1875
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: grid
  font-size: 16px
  gap: 20px
  grid-template-columns: 200px 300px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>left <div>
  getBoundingClientRect: x=0 y=0 width=200 height=19.1875
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  gap: normal
  grid-template-columns: none
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>right <div>
  getBoundingClientRect: x=220 y=0 width=300 height=19.1875
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  gap: normal
  grid-template-columns: none
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

Attached is a screenshot of the rendered page at 600x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

The `root` element is a grid container with two columns defined as `200px` and `300px` respectively, separated by a `gap` of `20px`. The first child (`root>left`) occupies the first column starting at `x=0`, while the second child (`root>right`) occupies the second column. Therefore, the left edge of `root>right` begins after the first column's width and the gap: `200px + 20px = 220px`.

ANSWER: 220
