# overflow-is-not-truncation — opencode/gpt-5.4-nano

- arm: `shot+dom`
- probes: overflowing text is still painted, not cut off
- expected: YES — overflow is visible, so the spilled line is still drawn
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 9838ms
- attached: `page.png`

## Question

The last line of `root>card`'s text sits below the bottom edge of `root>card`. Is that last line still painted on the page, where a person could read it?

## Context shown to the model

![page.png](page.png)

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

Attached is a screenshot of the rendered page at 400x300 CSS px, at 1 device pixel per CSS px.
```

## Model reply

`root>card` has `overflow: visible` in its computed style, meaning any content that extends beyond its box is still painted rather than clipped. The evidence also shows the card’s own box is only 48px tall, but the last line of text extending below that edge is consistent with overflow content. With overflow not hidden/truncated, a person could still read the line where it renders.

ANSWER: YES
