# hover-state — opencode/gpt-5.4-mini

- arm: `dom`
- probes: reading a state delta without mistaking it for the resting style
- expected: #3355ff (or the same colour written any other way)
- parsed answer: `rgb(51, 85, 255)`
- verdict: **PASS**
- elapsed: 7180ms

## Question

What is the background colour of `root>cta` when the page is first painted and the pointer is elsewhere?

## Context shown to the model


```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 400x300

root      div
root>cta  div  "Continue"

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=400 height=43.1875
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>cta <div>
  getBoundingClientRect: x=0 y=0 width=400 height=43.1875
  background-color: rgb(51, 85, 255)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  z-index: auto
  padding: 12px 12px 12px 12px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

Then the same data again while the mouse hovers `root>cta` — compare the two for what the `:hover` state changes:

root <div>
  getBoundingClientRect: x=0 y=0 width=400 height=43.1875
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>cta <div>
  getBoundingClientRect: x=0 y=0 width=400 height=43.1875
  background-color: rgb(0, 34, 204)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  z-index: auto
  padding: 12px 12px 12px 12px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px
```

## Model reply

The first set of computed styles is the non-hover state, since the second set is explicitly “while the mouse hovers `root>cta`.” In the non-hover state, `root>cta` has `background-color: rgb(51, 85, 255)`, and that changes to `rgb(0, 34, 204)` on hover. So the initial background colour is the non-hover value.

ANSWER: rgb(51, 85, 255)
