# overflow-is-not-truncation — opencode/claude-haiku-4-5

- arm: `dom`
- probes: overflowing text is still painted, not cut off
- expected: YES — overflow is visible, so the spilled line is still drawn
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 10799ms

## Question

The last line of `root>card`'s text sits below the bottom edge of `root>card`. Is that last line still painted on the page, where a person could read it?

## Context shown to the model


```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 400x300

root       div
root>card  div  "Payment failed because the card on file expired last month."

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=400 height=48
  background-color: rgba(0, 0, 0, 0)
  border-style: solid
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 48px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  width: 400px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>card <div>
  getBoundingClientRect: x=0 y=0 width=180 height=48
  background-color: rgba(0, 0, 0, 0)
  border-style: solid
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 48px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  width: 180px
  z-index: auto
  padding: 8px 8px 8px 8px
  border-width: 1px 1px 1px 1px
  margin: 0px 0px 0px 0px
```

## Model reply

Looking at the provided data, I need to determine if the last line of text in `root>card` extends below its container and whether it's visible.

From the `getBoundingClientRect()` data:
- `root>card` has height: 48px and y position: 0, so its bottom edge is at y=48px
- The computed styles show: font-size: 16px, line-height: 19.2px, padding: 8px on all sides
- With 8px top and bottom padding, the available content height is 48px - 16px = 32px

The text "Payment failed because the card on file expired last month." is described as having a last line that sits below the bottom edge of `root>card`. However, the critical detail is the `overflow: visible` property on `root>card`. This means content that extends beyond the container's boundaries is not clipped—it will still be painted and visible on the page. The container itself may end at y=48px, but overflowing content renders beyond that boundary.

Therefore, even though the last line extends below the container's bottom edge, it is still painted and readable because overflow is set to visible rather than hidden or auto.

ANSWER: YES
