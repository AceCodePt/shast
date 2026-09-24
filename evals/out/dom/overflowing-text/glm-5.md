# overflowing-text — opencode/glm-5

- arm: `dom`
- probes: content taller than a fixed height spills outside the box; it is not cut off
- expected: NO — four wrapped lines need 76.75px inside a 30px content box
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 74844ms

## Question

Does all of `root>card`'s text fit inside `root>card`'s own 48px-tall border box?

## Context shown to the model


```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 400x300

root       div
root>card  div  "Payment failed because the card on file expired last month."

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=400 height=48
  background-color: rgba(0, 0, 0, 0)
  border-style: solid
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 48px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  width: 400px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>card <div>
  getBoundingClientRect: x=0 y=0 width=180 height=48
  background-color: rgba(0, 0, 0, 0)
  border-style: solid
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 48px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  width: 180px
  z-index: auto
  padding: 8px 8px 8px 8px
  border-width: 1px 1px 1px 1px
  margin: 0px 0px 0px 0px
```

## Model reply

## Reasoning

`root>card` has a **border-box height of 48px** (from `getBoundingClientRect`). Subtracting the 1px borders and 8px paddings (top + bottom), the **content box is only 30px tall** and **162px wide** (180 − 2 − 16).

The text *"Payment failed because the card on file expired last month."* is ~59 characters at **16px** font with **19.2px** line-height. In a 162px-wide content box, that text must wrap. Even with a generous ~7px average character width, only ~23 characters fit per line, producing **at least 3 lines**:

> 3 × 19.2px = **57.6px** of text height

That 57.6px exceeds the 48px border box (and far exceeds the 30px content box). Since `overflow: visible`, the extra text spills out but is still not "inside" the border box.

ANSWER: NO
