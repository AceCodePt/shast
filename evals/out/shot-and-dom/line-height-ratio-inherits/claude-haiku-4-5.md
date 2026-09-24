# line-height-ratio-inherits — opencode/claude-haiku-4-5

- arm: `shot+dom`
- probes: a unitless line-height inheriting as a ratio rather than a length
- expected: 64 — the unitless 2 inherits as a ratio and re-resolves against 32px, rather than inheriting the root's computed 32px line box
- parsed answer: `64`
- verdict: **PASS**
- elapsed: 7533ms
- attached: `page.png`

## Question

`root` declares `font-size: 16px` and `line-height: 2`. `root>big` declares `font-size: 32px` and nothing else. How tall does `root>big` render?

## Context shown to the model

![page.png](page.png)

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

Attached is a screenshot of the rendered page at 600x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

Looking at the browser data provided:

The `root` element has `font-size: 16px` and `line-height: 2` (a unitless ratio). This means the root's line-height is `2 × 16px = 32px`.

The `root>big` element declares `font-size: 32px` and nothing else for line-height. Since `line-height` is not specified, it inherits from the parent (`root`). When a unitless `line-height` value is inherited, it is NOT recalculated based on the child's font-size—the computed value (32px) is inherited directly.

Therefore, `root>big` has `font-size: 32px` and `line-height: 32px`, giving it a height of 32px.

However, looking at the actual `getBoundingClientRect()` data in the information, `root>big` has `height: 64px` and `line-height: 64px`. This indicates the browser computed the line-height ratio against the child's own font-size (32px × 2 = 64px), meaning the unitless ratio was inherited and recalculated.

Based on the actual rendered data provided: `root>big` renders with a height of **64px**.

ANSWER: 64
