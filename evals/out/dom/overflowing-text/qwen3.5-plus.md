# overflowing-text — opencode/qwen3.5-plus

- arm: `dom`
- probes: content taller than a fixed height spills outside the box; it is not cut off
- expected: NO — four wrapped lines need 76.75px inside a 30px content box
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 22704ms

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

Looking at the data provided:

1. `root>card` has a border box height of **48px** (from `getBoundingClientRect`)
2. The content area height is: 48px - 8px (top padding) - 8px (bottom padding) - 1px (top border) - 1px (bottom border) = **30px**
3. The `line-height` is **19.2px**, so the content area can fit approximately 30/19.2 ≈ **1.5 lines** of text
4. The text "Payment failed because the card on file expired last month." is 62 characters long
5. With a content width of ~162px (180px - 16px padding - 2px border) and 16px font size, this text would wrap to approximately **5-7 lines**
6. 5-7 lines × 19.2px line-height = 96-134px of vertical space needed, far exceeding the 30px content area

The text requires significantly more vertical space than the 48px border box provides, so it will overflow (which is allowed since `overflow: visible`).

ANSWER: NO
