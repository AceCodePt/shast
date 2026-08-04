# z-index-scoped — opencode/minimax-m2.5

- arm: `dom`
- probes: z-index is scoped to its stacking context, so a bigger number can still lose
- expected: root>high
- parsed answer: `root>high`
- verdict: **PASS**
- elapsed: 8155ms

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

`root>low` has `position: absolute` with `z-index: 1`, which makes it a stacking context that contains `root>low>inner`. The inner element's `z-index: 999` only orders it *within* that parent's stacking context, not against the root level. At the root level, `root>low`'s stacking context (z-index 1) is compared against `root>high` (z-index 2, also `position: absolute`). Since 2 > 1, `root>high` is painted on top of the entire `root>low` subtree, including `inner`.

ANSWER: root>high
