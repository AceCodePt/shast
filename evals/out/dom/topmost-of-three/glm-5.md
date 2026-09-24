# topmost-of-three — opencode/glm-5

- arm: `dom`
- probes: paint order across three overlapping boxes at one point
- expected: root>middle (z-index 3, all three in the root context)
- parsed answer: `root>middle`
- verdict: **PASS**
- elapsed: 8747ms

## Question

All three boxes overlap the point 120,120. Which one does a viewer actually see at that point?

## Context shown to the model


```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 500x400

root         div
root>back    div
root>middle  div
root>front   div

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=500 height=300
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
  width: 500px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>back <div>
  getBoundingClientRect: x=40 y=40 width=200 height=200
  background-color: rgb(17, 17, 17)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 200px
  left: 40px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  top: 40px
  width: 200px
  z-index: 1
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>middle <div>
  getBoundingClientRect: x=80 y=80 width=200 height=200
  background-color: rgb(34, 34, 34)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 200px
  left: 80px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  top: 80px
  width: 200px
  z-index: 3
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>front <div>
  getBoundingClientRect: x=100 y=100 width=60 height=60
  background-color: rgb(51, 51, 51)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 60px
  left: 100px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  top: 100px
  width: 60px
  z-index: 2
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px
```

## Model reply

All three boxes are positioned descendants of the same positioned parent (`root`, `position: relative`), so they share a single stacking context and their `z-index` values compare directly. At point 120,120 all three overlap, so the one with the highest z-index is visible on top. `middle` has z-index 3, `front` has z-index 2, and `back` has z-index 1, so `middle` wins despite its name.

ANSWER: root>middle
