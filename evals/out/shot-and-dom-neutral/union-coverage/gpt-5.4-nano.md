# union-coverage — opencode/gpt-5.4-nano

- arm: `shot+dom`
- probes: two coverers that hide half a line each; neither alone would hide it
- expected: NO — together the two cover the whole line
- parsed answer: `YES`
- verdict: **FAIL (misread)**
- elapsed: 11609ms
- attached: `page.png`

## Question

Can a viewer read the words in `root>line`? Note that neither covering box on its own spans the whole line.

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 400x300

root            div
root>line       div  "Hidden by two"
root>leftHalf   div
root>rightHalf  div

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=400 height=200
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 200px
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

root>line <div>
  getBoundingClientRect: x=0 y=0 width=400 height=19.1875
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 19.1875px
  left: auto
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  top: auto
  width: 400px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>leftHalf <div>
  getBoundingClientRect: x=0 y=0 width=70 height=20
  background-color: rgb(16, 16, 16)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 20px
  left: 0px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  top: 0px
  width: 70px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>rightHalf <div>
  getBoundingClientRect: x=60 y=0 width=80 height=20
  background-color: rgb(32, 32, 32)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 20px
  left: 60px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  top: 0px
  width: 80px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

Attached is a screenshot of the rendered page at 400x300 CSS px, at 1 device pixel per CSS px.
```

## Model reply

`root>line` is a `<div>` with a bounding box spanning the full width (about 400px), and the node tree indicates the text `"Hidden by two"` is inside it. The two covering boxes (`root>leftHalf` and `root>rightHalf`) are absolutely positioned and only cover the left portion of the line (roughly x=0..70 and x=60..140), so they do not cover the entire line area. Since at least some part of `root>line` is not covered, a viewer can read the words in `root>line`.

ANSWER: YES
