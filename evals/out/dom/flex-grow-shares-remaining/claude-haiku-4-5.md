# flex-grow-shares-remaining — opencode/claude-haiku-4-5

- arm: `dom`
- probes: flex-grow dividing the free space
- expected: 400 — the free 600px is split 1:2, so `root>b` gets two thirds
- parsed answer: `400`
- verdict: **PASS**
- elapsed: 7828ms

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

Looking at the data provided:

The `root` container is 600px wide and uses `display: flex`. The two child elements have `flex: 1 1 0%` and `flex: 2 1 0%` respectively.

With flexbox, when `flex-basis` is 0%, the space is distributed proportionally based on the `flex-grow` values. `root>a` has `flex-grow: 1` and `root>b` has `flex-grow: 2`, meaning the available space is split into 3 parts (1 + 2 = 3), with `root>b` receiving 2/3 of it.

Therefore: `root>b` width = (2/3) × 600px = 400px

This is confirmed by the `getBoundingClientRect()` data, which shows `root>b` has `width=400`.

ANSWER: 400
