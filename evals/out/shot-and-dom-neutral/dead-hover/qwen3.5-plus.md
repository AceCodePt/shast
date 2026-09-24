# dead-hover — opencode/qwen3.5-plus

- arm: `shot+dom`
- probes: a `:hover` block that is overruled, which is invisible unless it is reported
- expected: NO — the root's `> mid > leaf` block outranks the :hover, so the hover declaration is dead
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 14261ms
- attached: `rest.png`, `hover.png`

## Question

`root>mid>leaf` has a `:hover` block setting `padding: 40px`. Does hovering over it change its padding?

## Context shown to the model

![rest.png](rest.png)
![hover.png](hover.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 500x300

root           div
root>mid       div
root>mid>leaf  div  "Leaf"

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=500 height=23.1875
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

root>mid <div>
  getBoundingClientRect: x=0 y=0 width=500 height=23.1875
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

root>mid>leaf <div>
  getBoundingClientRect: x=0 y=0 width=500 height=23.1875
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  z-index: auto
  padding: 2px 2px 2px 2px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

Then the same data again while the mouse hovers `root>mid>leaf` — compare the two for what the `:hover` state changes:

root <div>
  getBoundingClientRect: x=0 y=0 width=500 height=23.1875
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

root>mid <div>
  getBoundingClientRect: x=0 y=0 width=500 height=23.1875
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

root>mid>leaf <div>
  getBoundingClientRect: x=0 y=0 width=500 height=23.1875
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  z-index: auto
  padding: 2px 2px 2px 2px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

Two screenshots of the rendered page are attached, both 500x300 CSS px at 1 device pixel per CSS px: first the page at rest, then the page while the mouse hovers `root>mid>leaf`. Compare them.
```

## Model reply

Looking at the computed style data:

**At rest:** `root>mid>leaf` has `padding: 2px 2px 2px 2px`

**While hovering:** `root>mid>leaf` has `padding: 2px 2px 2px 2px`

The padding values are identical in both states. Even though there may be a `:hover` CSS rule that attempts to set `padding: 40px`, the browser's computed style shows no actual change—the padding remains 2px on all sides. The screenshots also appear identical, confirming no visual change occurs on hover.

ANSWER: NO
