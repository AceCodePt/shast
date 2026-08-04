# occluded-text — opencode/gemini-3-flash

- arm: `shot+dom`
- probes: an opaque positioned box hides the text of an in-flow box under it
- expected: NO — the banner paints an opaque background over its lines
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 14163ms
- attached: `page.png`

## Question

Can a person reading this page in a browser read the whole sentence in `root>lede`?

## Context shown to the model

![page.png](page.png)

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

Attached is a screenshot of the rendered page at 600x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

The `root>lede` element is positioned at the top of the viewport (`y=0`) with a height of `54.375px`. However, the `root>banner` element is also positioned at `y=0` with a height of `70px`, a higher `z-index` of 5, and an opaque background color (`rgb(34, 34, 34)`). This results in the banner completely occluding the `root>lede` paragraph, as shown in the screenshot where the dark bar covers the top of the page and even cuts off the top of the subsequent `root>body` text.

ANSWER: NO
