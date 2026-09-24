# padding-shrinks-content-box — opencode/gemini-3.5-flash-lite

- arm: `dom`
- probes: padding reducing the content width, and the wrapping that follows
- expected: 4 — the 200px box keeps its width and the 24px padding shrinks the content box to 152px
- parsed answer: `4`
- verdict: **PASS**
- elapsed: 7741ms

## Question

How many lines does the text inside `root>card` wrap onto?

## Context shown to the model


```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root       div
root>card  div  "one two three four five six seven eight nine ten"

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=600 height=124.75
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  width: 600px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>card <div>
  getBoundingClientRect: x=0 y=0 width=200 height=124.75
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  width: 200px
  z-index: auto
  padding: 24px 24px 24px 24px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px
```

## Model reply

The total height of the `root>card` element is 124.75px, and with 24px of padding on both the top and bottom, the content area height is 76.75px (124.75px - 48px). Dividing this content height by the line-height of 19.2px yields approximately 4 lines (76.75 / 19.2 ≈ 4.0). Therefore, the text wraps onto 4 lines.

ANSWER: 4
