# text-collision — opencode/claude-haiku-4-5

- arm: `shot+dom`
- probes: two nodes drawing glyphs on the same pixels, with neither displaced nor covered
- expected: root>visible
- parsed answer: `root>visible`
- verdict: **PASS**
- elapsed: 8276ms
- attached: `page.png`

## Question

Which node's text is drawn on the same pixels as `root>ghost`'s text?

## Context shown to the model

![page.png](page.png)

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

Attached is a screenshot of the rendered page at 400x300 CSS px, at 1 device pixel per CSS px.
```

## Model reply

Looking at the information provided:

The `root>ghost` node has dimensions of 0x0 (width=0px, height=0px), meaning it takes up no space on the screen. However, it contains the text "Important warning" according to the node tree.

The `root>visible` node has dimensions of 400x19.1875px and contains the text "Everything is fine". Both nodes have identical `getBoundingClientRect()` coordinates (x=0, y=0).

Since `root>ghost` has zero width and height, its text would be rendered at position (0,0) but with dimensions that don't create a visible bounding box. The `root>visible` node also starts at position (0,0) with full width and height. Given that both nodes are positioned at the same origin and the ghost node's text would be rendered there despite having no layout box, the text from `root>ghost` ("Important warning") would be drawn on the same pixels as `root>visible`'s text ("Everything is fine") - they would overlap at the same location.

ANSWER: root>visible
