# z-index-scoped — opencode/qwen3.5-plus

- arm: `shot+dom`
- probes: z-index is scoped to its stacking context, so a bigger number can still lose
- expected: root>high
- parsed answer: `root>high`
- verdict: **PASS**
- elapsed: 18480ms
- attached: `page.png`

## Question

`root>low>inner` and `root>high` overlap. Which of the two is the one a viewer sees in the overlapping region?

## Context shown to the model

![page.png](page.png)

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

Attached is a screenshot of the rendered page at 600x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

Looking at the z-index values and stacking contexts:

- `root>low` has `z-index: 1` and creates a stacking context (it's positioned)
- `root>low>inner` has `z-index: 999`, but this is **confined within** its parent's stacking context
- `root>high` has `z-index: 2` at the root level

Since `root>high` (z-index: 2) is at the root stacking context and `root>low` (z-index: 1) is also at the root level, `root>high` stacks above `root>low` and all its children, regardless of `root>low>inner`'s high z-index value. The child's z-index only matters relative to siblings within the same stacking context.

The screenshot confirms this: the red box (`root>high`) appears on top of the blue box (`root>low>inner`) in the overlapping region.

ANSWER: root>high
