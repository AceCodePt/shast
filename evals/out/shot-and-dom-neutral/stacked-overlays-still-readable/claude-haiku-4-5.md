# stacked-overlays-still-readable — opencode/claude-haiku-4-5

- arm: `shot+dom`
- probes: coverage is not transitive: two coverers, and the text is still legible
- expected: YES — the transparent one hides nothing and the opaque one sits below the text line
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 9343ms
- attached: `page.png`

## Question

Two boxes paint over `root>line`. Can a viewer still read its text?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 400x300

root        div
root>line   div  "Still readable"
root>glass  div
root>panel  div

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=400 height=200
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 200px
  left: 0px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: relative
  top: 0px
  width: 400px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>line <div>
  getBoundingClientRect: x=0 y=0 width=400 height=19.1875
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 19.1875px
  left: auto
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  top: auto
  width: 400px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>glass <div>
  getBoundingClientRect: x=0 y=0 width=400 height=100
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 100px
  left: 0px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  top: 0px
  width: 400px
  z-index: 1
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>panel <div>
  getBoundingClientRect: x=0 y=40 width=400 height=60
  background-color: rgb(48, 48, 48)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 60px
  left: 0px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  top: 40px
  width: 400px
  z-index: 2
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

Attached is a screenshot of the rendered page at 400x300 CSS px, at 1 device pixel per CSS px.
```

## Model reply

Looking at the rendering data:

The `root>line` div contains "Still readable" and is positioned at y=0 with height=19.1875px, so it occupies the top portion of the viewport.

Two boxes paint over it:
1. `root>glass` - positioned at y=0, height=100px, z-index=1
2. `root>panel` - positioned at y=40, height=60px, z-index=2

The `root>panel` box has a solid background-color of `rgb(48, 48, 48)` (dark gray) and z-index=2, which means it's the topmost layer. Since the panel starts at y=40 and the text is at y=0-19.1875, the panel overlaps the text. With an opaque dark background and higher z-index than the glass element, the text would be obscured by the dark panel.

However, the screenshot shows "Still readable" text is visible at the top in black, which means the text is rendering above the overlaying boxes. Looking more carefully at the z-stacking: the text itself (not in a separate z-indexed container) would render in document order after the glass and panel divs, making it appear on top despite those divs having z-index values. This is consistent with what the screenshot displays.

ANSWER: YES
