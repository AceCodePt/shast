# z-index-scoped — opencode/gemini-3-flash

- arm: `dom`
- probes: z-index is scoped to its stacking context, so a bigger number can still lose
- expected: root>high
- parsed answer: `root>high`
- verdict: **PASS**
- elapsed: 11088ms

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

Both `root>low` and `root>high` are positioned elements that create stacking contexts within their parent. `root>low` has a `z-index` of 1, while `root>high` has a `z-index` of 2. Because `root>high` has a higher `z-index` in the same stacking context, it renders above `root>low` and all of its descendants, including `root>low>inner`, regardless of the `inner` node's own `z-index`.

ANSWER: root>high
