# line-height-ratio-inherits — opencode/gemini-3-flash

- arm: `dom`
- probes: a unitless line-height inheriting as a ratio rather than a length
- expected: 64 — the unitless 2 inherits as a ratio and re-resolves against 32px, rather than inheriting the root's computed 32px line box
- parsed answer: `64`
- verdict: **PASS**
- elapsed: 21084ms

## Question

`root` declares `font-size: 16px` and `line-height: 2`. `root>big` declares `font-size: 32px` and nothing else. How tall does `root>big` render?

## Context shown to the model


```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root        div
root>small  div  "small"
root>big    div  "big"

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=600 height=96
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  line-height: 32px
  opacity: 1
  overflow: visible
  position: static
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>small <div>
  getBoundingClientRect: x=0 y=0 width=600 height=32
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  line-height: 32px
  opacity: 1
  overflow: visible
  position: static
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>big <div>
  getBoundingClientRect: x=0 y=32 width=600 height=64
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 32px
  line-height: 64px
  opacity: 1
  overflow: visible
  position: static
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px
```

## Model reply

The element `root>big` inherits the unitless `line-height: 2` from its parent `root`. Unlike fixed units, unitless `line-height` values are inherited as a factor, meaning the child calculates its own line height by multiplying that factor by its own `font-size` (32px). This results in a computed `line-height` and total height of 64px, which is confirmed by the browser's `getBoundingClientRect` data.

ANSWER: 64
