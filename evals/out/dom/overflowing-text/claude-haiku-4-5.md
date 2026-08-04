# overflowing-text — opencode/claude-haiku-4-5

- arm: `dom`
- probes: content taller than a fixed height spills outside the box; it is not cut off
- expected: NO — four wrapped lines need 76.75px inside a 30px content box
- parsed answer: `YES`
- verdict: **FAIL (misread)**
- elapsed: 8509ms

## Question

Does all of `root>card`'s text fit inside `root>card`'s own 48px-tall border box?

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

Looking at the computed styles and layout information:

The `root>card` element has:
- Height: 48px
- Padding: 8px on all sides
- Line-height: 19.2px
- Font-size: 16px

This means the content area available for text is 48px (height) - 8px (top padding) - 8px (bottom padding) = 32px tall.

The text "Payment failed because the card on file expired last month." has a line-height of 19.2px. Since this is a single line of text and the line-height (19.2px) is less than the available content height (32px), the text does fit within the border box.

The element's `getBoundingClientRect` shows width of 180px with 8px padding on each side, leaving 164px for content, which is sufficient for this text to fit on a single line or wrap appropriately.

ANSWER: YES
