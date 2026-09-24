# z-index-scoped — opencode/claude-haiku-4-5

- arm: `dom`
- probes: z-index is scoped to its stacking context, so a bigger number can still lose
- expected: root>high
- parsed answer: `root>low>inner`
- verdict: **FAIL (answer-line slip or no reply)**
- elapsed: 6291ms

## Question

`root>low>inner` and `root>high` overlap. Which of the two is the one a viewer sees in the overlapping region?

## Context shown to the model


```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root            div
root>low        div
root>low>inner  div  "inner"
root>high       div  "high"

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

root>low <div>
  getBoundingClientRect: x=0 y=0 width=300 height=200
  background-color: rgb(238, 238, 238)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 200px
  left: 0px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  top: 0px
  width: 300px
  z-index: 1
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>low>inner <div>
  getBoundingClientRect: x=10 y=10 width=280 height=180
  background-color: rgb(51, 85, 255)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 180px
  left: 10px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  top: 10px
  width: 280px
  z-index: 999
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>high <div>
  getBoundingClientRect: x=50 y=50 width=300 height=100
  background-color: rgb(255, 51, 85)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 100px
  left: 50px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  top: 50px
  width: 300px
  z-index: 2
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px
```

## Model reply

Looking at the z-index values:
- `root>low>inner` has `z-index: 999`
- `root>high` has `z-index: 2`

In CSS stacking contexts, elements with higher z-index values appear on top of elements with lower z-index values. Since 999 is significantly higher than 2, `root>low>inner` will be rendered above `root>high` in the overlapping region.

Both elements are positioned absolutely and are siblings within the same stacking context (the root div), so the z-index comparison directly determines their stacking order.

ANSWER: root>low>inner
