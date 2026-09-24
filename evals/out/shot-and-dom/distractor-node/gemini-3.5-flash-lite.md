# distractor-node — opencode/gemini-3.5-flash-lite

- arm: `shot+dom`
- probes: answering about the node asked for, not the flagged one next to it
- expected: YES — only `root>first` is covered
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 7752ms
- attached: `page.png`

## Question

Can a viewer read the text in `root>second`?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 500x300

root         div
root>first   p    "First paragraph here"
root>second  p    "Second paragraph here"
root>cover   div

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=500 height=250
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 250px
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

root>first <p>
  getBoundingClientRect: x=0 y=0 width=500 height=19.1875
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
  width: 500px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>second <p>
  getBoundingClientRect: x=0 y=19.1875 width=500 height=19.1875
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
  width: 500px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>cover <div>
  getBoundingClientRect: x=0 y=0 width=500 height=19
  background-color: rgb(0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 19px
  left: 0px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  top: 0px
  width: 500px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

Attached is a screenshot of the rendered page at 500x300 CSS px, at 1 device pixel per CSS px.
```

## Model reply

`root>second` is positioned at y=19.1875, directly below the black cover div (`root>cover`) which only spans from y=0 to y=19. Therefore, the text in `root>second` ("Second paragraph here") is not covered by the black bar and is fully visible to a viewer.

ANSWER: YES
