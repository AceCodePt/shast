# overflow-is-not-truncation — opencode/claude-haiku-4-5

- arm: `dom`
- probes: overflowing text is still painted, not cut off
- expected: YES — overflow is visible, so the spilled line is still drawn
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 7822ms

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

Let me analyze the information provided:

The `root>card` div has:
- Height: 48px
- Padding: 8px on all sides
- Line-height: 19.2px
- Overflow: visible

The text "Payment failed because the card on file expired last month." is contained within `root>card`.

With padding of 8px on top and bottom, the available content area is 48px - 8px - 8px = 32px tall.

The line-height is 19.2px. If the text wraps into multiple lines, a second line would start at 19.2px from the first line's baseline. Given the limited 32px height available after padding, a second line of text would extend beyond the 48px boundary of the `root>card` div.

However, the crucial detail is the `overflow: visible` property. This means content that extends beyond the element's box is still rendered and visible on the page—it's not clipped or hidden.

Therefore, even though the last line of text extends below the bottom edge of `root>card`, it will still be painted on the page because overflow is set to visible, not hidden or auto.

ANSWER: YES
