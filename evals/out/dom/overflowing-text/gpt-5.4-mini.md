# overflowing-text — opencode/gpt-5.4-mini

- arm: `dom`
- probes: content taller than a fixed height spills outside the box; it is not cut off
- expected: NO — four wrapped lines need 76.75px inside a 30px content box
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 9516ms

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

No. The card’s border box is 48px tall, but it has 8px top and bottom padding plus 1px borders, leaving only 30px for content. The text is a long sentence that would wrap, and even two lines at `line-height: 19.2px` would need more than 30px, so not all of it fits inside the card’s own box.

ANSWER: NO
