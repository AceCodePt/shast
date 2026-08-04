# overflow-is-not-truncation — opencode/qwen3.5-plus

- arm: `dom`
- probes: overflowing text is still painted, not cut off
- expected: YES — overflow is visible, so the spilled line is still drawn
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 20391ms

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

Looking at the data:

1. **Card dimensions**: `root>card` has height=48px and extends from y=0 to y=48
2. **Text content**: "Payment failed because the card on file expired last month." (62 characters)
3. **Line metrics**: font-size=16px, line-height=19.2px
4. **Content width**: 180px width - 16px padding = 164px for text

At ~164px content width with 16px font, roughly 10-12 characters fit per line. The 62-character message would wrap to approximately 5-6 lines. With 19.2px line-height, the 5th line would start around y=76.8px, well beyond the card's bottom edge at y=48.

**However**, the critical property is `overflow: visible` on the card element. This means content is NOT clipped when it exceeds the element's box — it paints outside the boundaries and remains visible to the user.

ANSWER: YES
