# stacked-overlays-still-readable — opencode/qwen3.5-plus

- arm: `shot+dom`
- probes: coverage is not transitive: two coverers, and the text is still legible
- expected: YES — the transparent one hides nothing and the opaque one sits below the text line
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 18432ms
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

Looking at the stacking and positioning:

1. **`root>line`** (the text) is at y=0 with height ~19px
2. **`root>glass`** (z-index: 1) covers y=0 to y=100px but has `background-color: rgba(0, 0, 0, 0)` — fully transparent
3. **`root>panel`** (z-index: 2) covers y=40px to y=100px with a solid dark background `rgb(48, 48, 48)`

The text sits at y=0 to ~19px. The opaque panel starts at y=40px, which is **below** the text. The glass element does cover that area but is completely transparent, so it doesn't obscure anything.

The screenshot confirms this — "Still readable" appears at the top, with the dark panel bar visible below it.

ANSWER: YES
