# transparent-overlay — opencode/gemini-3-flash

- arm: `dom`
- probes: the same geometry with a transparent coverer must NOT read as hidden
- expected: YES — the banner has no background, so the text shows through
- parsed answer: `NO`
- verdict: **FAIL (misread)**
- elapsed: 10471ms

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
  background-color: rgba(0, 0, 0, 0)
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

The `root>lede` element and the `root>banner` element are both positioned at the top-left of the viewport (`x=0, y=0`). The `root>banner` has `position: absolute`, a height of 70px, and a `z-index` of 5, while the `root>lede` has a height of only 54.375px. Because the banner is positioned directly over the lede and has a higher stacking order, it completely covers the text in `root>lede`.

ANSWER: NO
