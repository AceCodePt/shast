# own-wins-on-source-order — opencode/gpt-5.4-nano

- arm: `shot+dom`
- probes: the inverse of dead-declaration: a node's own block sometimes does win
- expected: 64px — `&.big` ties on specificity and is printed later
- parsed answer: `19`
- verdict: **FAIL (answer-line slip or no reply)**
- elapsed: 9984ms
- attached: `page.png`

## Question

Three different blocks declare `padding` for `root>child`. What padding does it actually render with?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 500x300

root        div
root>child  div  "Child"

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=500 height=147.1875
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>child <div>
  getBoundingClientRect: x=0 y=0 width=500 height=147.1875
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  z-index: auto
  padding: 64px 64px 64px 64px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

Attached is a screenshot of the rendered page at 500x300 CSS px, at 1 device pixel per CSS px.
```

## Model reply

The browser’s `getComputedStyle()` output is authoritative for what `root>child` actually renders. For `root>child`, the computed `padding` is explicitly shown as `padding: 64px 64px 64px 64px` (top/right/bottom/left). Even though multiple declarations exist, the final computed value is what takes effect.

ANSWER: 19
