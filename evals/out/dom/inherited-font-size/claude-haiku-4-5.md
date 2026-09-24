# inherited-font-size — opencode/claude-haiku-4-5

- arm: `dom`
- probes: an effective text size that no line on the node declares
- expected: root>heading (30px inherited, against 22px declared)
- parsed answer: `root>heading`
- verdict: **PASS**
- elapsed: 8151ms

## Question

Which renders with larger text, `root>heading` or `root>caption`?

## Context shown to the model


```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 500x300

root          div
root>heading  div  "Quarterly report"
root>caption  div  "Draft"

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=500 height=62.390625
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 30px
  line-height: 36px
  opacity: 1
  overflow: visible
  position: static
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>heading <div>
  getBoundingClientRect: x=0 y=0 width=500 height=36
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 30px
  line-height: 36px
  opacity: 1
  overflow: visible
  position: static
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>caption <div>
  getBoundingClientRect: x=0 y=36 width=500 height=26.390625
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 22px
  line-height: 26.4px
  opacity: 1
  overflow: visible
  position: static
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px
```

## Model reply

Looking at the computed styles provided:

- `root>heading` has a `font-size: 30px`
- `root>caption` has a `font-size: 22px`

Since `root>heading` has a larger font-size (30px vs 22px), it renders with larger text. The line-height values (36px vs 26.4px) also reflect this proportional difference.

ANSWER: root>heading
