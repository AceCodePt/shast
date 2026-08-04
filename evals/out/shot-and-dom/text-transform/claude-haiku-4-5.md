# text-transform — opencode/claude-haiku-4-5

- arm: `shot+dom`
- probes: text that renders differently from the string in the source
- expected: ANNUAL REVIEW
- parsed answer: `ANNUAL REVIEW`
- verdict: **PASS**
- elapsed: 6446ms
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

Looking at the information provided, I need to identify what characters are actually visible in the `root>title` element.

The node tree shows:
```
root>title  div  "Annual review"
```

This tells me the source text is "Annual review". However, the key detail is that the computed style shows `text-transform: uppercase` is applied to both the root and root>title elements.

The CSS `text-transform: uppercase` property transforms the text to uppercase characters for display, so "Annual review" would be rendered as "ANNUAL REVIEW" on the screen.

The screenshot confirms this - the visible text at the top of the page shows "ANNUAL REVIEW" in all caps.

ANSWER: ANNUAL REVIEW
