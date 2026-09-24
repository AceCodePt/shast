# padding-shrinks-content-box — opencode/claude-haiku-4-5

- arm: `shot+dom`
- probes: padding reducing the content width, and the wrapping that follows
- expected: 4 — the 200px box keeps its width and the 24px padding shrinks the content box to 152px
- parsed answer: `4`
- verdict: **PASS**
- elapsed: 7517ms
- attached: `page.png`

## Question

How many lines does the text inside `root>card` wrap onto?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root       div
root>card  div  "one two three four five six seven eight nine ten"

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=600 height=124.75
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  width: 600px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>card <div>
  getBoundingClientRect: x=0 y=0 width=200 height=124.75
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  width: 200px
  z-index: auto
  padding: 24px 24px 24px 24px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

Attached is a screenshot of the rendered page at 600x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

Looking at the visual evidence from the screenshot and the computed style information:

The text "one two three four five six seven eight nine ten" is displayed inside the `root>card` div, which has:
- Width: 200px
- Padding: 24px on all sides (reducing the available content width to 152px)
- Line height: 19.2px
- Font size: 16px

From the screenshot, I can count the text wrapping visually:
1. "one two three"
2. "four five six"
3. "seven eight"
4. "nine ten"

The `root>card` element has a `getBoundingClientRect` height of 124.75px. With a line-height of 19.2px, this accommodates approximately 124.75 / 19.2 ≈ 6.5 lines of space, but the actual text only uses 4 lines before ending.

ANSWER: 4
