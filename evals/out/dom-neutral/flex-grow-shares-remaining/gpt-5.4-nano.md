# flex-grow-shares-remaining — opencode/gpt-5.4-nano

- arm: `dom`
- probes: flex-grow dividing the free space
- expected: 400 — the free 600px is split 1:2, so `root>b` gets two thirds
- parsed answer: `400`
- verdict: **PASS**
- elapsed: 7068ms

## Question

`root` is `display: flex`. `root>a` has `flex: 1` and `root>b` has `flex: 2`. How wide is `root>b`?

## Context shown to the model


```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root    div
root>a  div  "A"
root>b  div  "B"

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=600 height=19.1875
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: flex
  flex: 0 1 auto
  font-size: 16px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>a <div>
  getBoundingClientRect: x=0 y=0 width=200 height=19.1875
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  flex: 1 1 0%
  font-size: 16px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>b <div>
  getBoundingClientRect: x=200 y=0 width=400 height=19.1875
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  flex: 2 1 0%
  font-size: 16px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px
```

## Model reply

`root` is a flex container with a viewport width of 600px. The browser’s own `getBoundingClientRect()` for `root>b` reports `x=200` and `width=400`, which reflects the final layout after flex sizing. Therefore, `root>b` occupies 400 CSS pixels in width.  
ANSWER: 400
