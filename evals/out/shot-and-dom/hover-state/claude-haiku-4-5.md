# hover-state — opencode/claude-haiku-4-5

- arm: `shot+dom`
- probes: reading a state delta without mistaking it for the resting style
- expected: #3355ff (or the same colour written any other way)
- parsed answer: `rgb(51, 85, 255)`
- verdict: **PASS**
- elapsed: 7651ms
- attached: `rest.png`, `hover.png`

## Question

What is the background colour of `root>cta` when the page is first painted and the pointer is elsewhere?

## Context shown to the model

![rest.png](rest.png)
![hover.png](hover.png)

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

Two screenshots of the rendered page are attached, both 400x300 CSS px at 1 device pixel per CSS px: first the page at rest, then the page while the mouse hovers `root>cta`. Compare them.
```

## Model reply

Looking at the browser data provided for the rest state (before hover), the `root>cta` element has:

```
background-color: rgb(51, 85, 255)
```

This is the computed style when the page is first painted and the pointer is elsewhere (not hovering over the element). The hover state shows a darker blue `rgb(0, 34, 204)`, confirming that the initial rest state uses the lighter blue value.

ANSWER: rgb(51, 85, 255)
