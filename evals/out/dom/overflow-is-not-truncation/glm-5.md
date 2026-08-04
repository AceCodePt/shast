# overflow-is-not-truncation — opencode/glm-5

- arm: `dom`
- probes: overflowing text is still painted, not cut off
- expected: YES — overflow is visible, so the spilled line is still drawn
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 26038ms

## Question

The last line of `root>card`'s text sits below the bottom edge of `root>card`. Is that last line still painted on the page, where a person could read it?

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

`root>card` has `overflow: visible` (confirmed in the computed style). This means content that overflows the element's content box is **not clipped** — it is still painted on the page and remains readable.

Let's verify the geometry. The card is 180px wide with 8px padding all around and 1px borders, giving a content area of 162px × 30px (48 − 8 − 8 − 1 − 1). With a 16px font and 19.2px line-height, the long sentence "Payment failed because the card on file expired last month." wraps to roughly three lines:

- Line 1: y ≈ 9 → 28.2
- Line 2: y ≈ 28.2 → 47.4
- Line 3: y ≈ 47.4 → 66.6

The card's bottom edge is at y = 48px, so line 3 (starting at ≈47.4 and extending to ≈66.6) sits below that edge. But because `overflow` is `visible` (not `hidden` or `clip`), the browser still paints that overflowing line — it spills out onto the page where a person can read it.

ANSWER: YES
