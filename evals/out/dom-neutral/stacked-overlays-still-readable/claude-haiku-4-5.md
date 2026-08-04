# stacked-overlays-still-readable — opencode/claude-haiku-4-5

- arm: `dom`
- probes: coverage is not transitive: two coverers, and the text is still legible
- expected: YES — the transparent one hides nothing and the opaque one sits below the text line
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 9851ms

## Question

Two boxes paint over `root>line`. Can a viewer still read its text?

## Context shown to the model


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
```

## Model reply

Let me analyze the layout information provided.

The `root>line` div contains the text "Still readable" and is positioned at y=0 with height=19.1875px, so it occupies the vertical range from 0 to ~19.

Two boxes paint over it:
1. `root>glass` - positioned absolutely at y=0, height=100px, z-index=1 (covers y range 0-100)
2. `root>panel` - positioned absolutely at y=40, height=60px, z-index=2 (covers y range 40-100)

The `root>line` text is in the range y=0 to y≈19. The `root>glass` box (z-index=1) covers this entire range. Even though `root>panel` (z-index=2) has a higher z-index, it only starts at y=40, which is below the text.

The critical issue is `root>glass`: it has a z-index of 1, which is higher than the default z-index of `root>line` (auto/0), and it completely covers the vertical space where the text appears (0-19px). However, `root>glass` has `background-color: rgba(0, 0, 0, 0)`, meaning it's fully transparent.

Since `root>glass` is transparent, the text underneath remains visible even though it's layered on top. The `root>panel` with its dark background (rgb(48, 48, 48)) doesn't overlap the text area (which ends at y≈19, while panel starts at y=40).

ANSWER: YES
