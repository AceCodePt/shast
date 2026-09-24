# text-collision — opencode/claude-haiku-4-5

- arm: `dom`
- probes: two nodes drawing glyphs on the same pixels, with neither displaced nor covered
- expected: root>visible
- parsed answer: `root>visible`
- verdict: **PASS**
- elapsed: 9039ms

## Question

Which node's text is drawn on the same pixels as `root>ghost`'s text?

## Context shown to the model


```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 400x300

root          div
root>ghost    div  "Important warning"
root>visible  div  "Everything is fine"

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=400 height=19.1875
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 19.1875px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  width: 400px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>ghost <div>
  getBoundingClientRect: x=0 y=0 width=0 height=0
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 0px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  width: 0px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>visible <div>
  getBoundingClientRect: x=0 y=0 width=400 height=19.1875
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 19.1875px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  width: 400px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px
```

## Model reply

Looking at the bounding rectangles:

- `root>ghost` has `getBoundingClientRect: x=0 y=0 width=0 height=0` — it occupies zero pixels
- `root>visible` has `getBoundingClientRect: x=0 y=0 width=400 height=19.1875` — it occupies the full width and height

Since `root>ghost` has zero dimensions (width=0, height=0), it doesn't actually render any visible text on the screen at all. No pixels are consumed by this node. However, if we interpret the question as asking which node's text would occupy the same pixel space *if* `root>ghost` were visible, that would be `root>visible`, since both start at the same position (x=0, y=0) and `root>visible` fills the available space where `root>ghost` would have rendered if it had non-zero dimensions.

ANSWER: root>visible
