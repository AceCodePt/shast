# overflowing-text — opencode/claude-haiku-4-5

- arm: `dom`
- probes: content taller than a fixed height spills outside the box; it is not cut off
- expected: NO — four wrapped lines need 76.75px inside a 30px content box
- parsed answer: `YES`
- verdict: **FAIL (misread)**
- elapsed: 7324ms

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

Let me analyze the dimensions and text rendering:

The `root>card` element has:
- Height: 48px
- Padding: 8px on all sides
- Line-height: 19.2px
- Font-size: 16px

The text content is: "Payment failed because the card on file expired last month."

With 8px padding on top and bottom, the available vertical space inside the border box is: 48px - 8px - 8px = 32px.

The line-height is 19.2px, which means a single line of text will take up 19.2px of vertical space. Since 19.2px < 32px, a single line of text will fit within the available space.

The element has `display: block`, `width: 180px` (with 8px horizontal padding = 164px of content width), and `overflow: visible`. The text appears to be rendered on a single line based on the DOM structure showing it as continuous text in one element.

Since one line of text (19.2px) fits comfortably within the available height (32px), all of the text fits inside the border box.

ANSWER: YES
