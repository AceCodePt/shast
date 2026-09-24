# occluded-text — opencode/claude-haiku-4-5

- arm: `dom`
- probes: an opaque positioned box hides the text of an in-flow box under it
- expected: NO — the banner paints an opaque background over its lines
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 10160ms

## Question

Can a person reading this page in a browser read the whole sentence in `root>lede`?

## Context shown to the model


```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root         div
root>lede    p    "The quarterly results are in and every region beat its targ…" (72 chars)
root>body    p    "Details follow in the table below."
root>banner  div

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

root>lede <p>
  getBoundingClientRect: x=0 y=0 width=600 height=54.375
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 54.375px
  left: auto
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  top: auto
  width: 600px
  z-index: auto
  padding: 8px 8px 8px 8px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>body <p>
  getBoundingClientRect: x=0 y=54.375 width=600 height=35.1875
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 35.1875px
  left: auto
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  top: auto
  width: 600px
  z-index: auto
  padding: 8px 8px 8px 8px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>banner <div>
  getBoundingClientRect: x=0 y=0 width=600 height=70
  background-color: rgb(34, 34, 34)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 70px
  left: 0px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  top: 0px
  width: 600px
  z-index: 5
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px
```

## Model reply

Let me analyze the information provided about the page layout.

The `root>lede` element is a `<p>` tag containing text that reads: "The quarterly results are in and every region beat its targ…" (72 chars total).

Looking at the layout:
- The `root>banner` div is positioned absolutely at `top: 0px` with `height: 70px` and `z-index: 5`
- The `root>lede` paragraph is positioned statically at `top: auto` with `y=0` in its bounding rect, meaning it starts at the top of the viewport
- The `root>lede` has a height of 54.375px and starts at y=0

Since the banner is absolutely positioned with `z-index: 5` and covers the area from y=0 to y=70, while the lede paragraph also starts at y=0 and extends to y=54.375, the banner will be layered on top of the lede content. The lede text would be hidden behind the banner's dark background (`rgb(34, 34, 34)`).

Additionally, the text shown in the source is truncated with "…" indicating it doesn't display the full sentence anyway.

Therefore, a person reading this page cannot read the whole sentence in `root>lede` because: (1) the banner overlays and obscures it, and (2) the text itself appears to be truncated in the display.

ANSWER: NO
