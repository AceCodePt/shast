# text-transform — opencode/claude-haiku-4-5

- arm: `shot+dom`
- probes: text that renders differently from the string in the source
- expected: ANNUAL REVIEW
- parsed answer: `ANNUAL REVIEW`
- verdict: **PASS**
- elapsed: 8047ms
- attached: `page.png`

## Question

Exactly what characters does a viewer see inside `root>title`?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 500x300

root        div
root>title  div  "Annual review"

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=500 height=19.1875
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  text-transform: uppercase
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>title <div>
  getBoundingClientRect: x=0 y=0 width=500 height=19.1875
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  text-transform: uppercase
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

Attached is a screenshot of the rendered page at 500x300 CSS px, at 1 device pixel per CSS px.
```

## Model reply

Looking at the information provided:

The node tree shows that `root>title` is a div element with the text "Annual review" as written in the source.

The computed styles indicate that `text-transform: uppercase` is applied to this element (inherited from the root). However, the question asks what characters a viewer actually sees, and the node tree explicitly states the text "as written in the source" - which is the authoritative representation of what is on screen according to the instructions.

The screenshot also visually confirms "ANNUAL REVIEW" is displayed, which shows the uppercase transformation is being applied and rendered.

Since `text-transform: uppercase` is applied via CSS, the viewer sees the text transformed to uppercase letters.

ANSWER: ANNUAL REVIEW
