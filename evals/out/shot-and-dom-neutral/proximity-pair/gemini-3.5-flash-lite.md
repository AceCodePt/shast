# proximity-pair — opencode/gemini-3.5-flash-lite

- arm: `shot+dom`
- probes: visual grouping from gaps, which the tree does not state and the boxes do
- expected: root>gamma (96px away; the other two are 4px apart)
- parsed answer: `root>gamma`
- verdict: **PASS**
- elapsed: 8724ms
- attached: `page.png`

## Question

`root>alpha`, `root>beta` and `root>gamma` are siblings. Which single one of the three is visually separated from the other two?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 400x400

root        div
root>alpha  div  "alpha"
root>beta   div  "beta"
root>gamma  div  "gamma"

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=400 height=300
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
  width: 400px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>alpha <div>
  getBoundingClientRect: x=20 y=20 width=120 height=40
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 40px
  left: 20px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  top: 20px
  width: 120px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>beta <div>
  getBoundingClientRect: x=20 y=64 width=120 height=40
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 40px
  left: 20px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  top: 64px
  width: 120px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>gamma <div>
  getBoundingClientRect: x=20 y=200 width=120 height=40
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 40px
  left: 20px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  top: 200px
  width: 120px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

Attached is a screenshot of the rendered page at 400x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

`root>alpha` and `root>beta` are positioned closely together with a gap of only 4 pixels (y=20 to y=60 for alpha, and y=64 to y=104 for beta), forming a proximity pair. In contrast, `root>gamma` is located much further down at y=200, leaving a large gap of 96 pixels from beta. Therefore, gamma is visually separated from the other two.

ANSWER: root>gamma
