# padding-shrinks-content-box — opencode/claude-haiku-4-5

- arm: `shot+dom`
- probes: padding reducing the content width, and the wrapping that follows
- expected: 4 — the 200px box keeps its width and the 24px padding shrinks the content box to 152px
- parsed answer: `4`
- verdict: **PASS**
- elapsed: 6324ms
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

Looking at the information provided:

The `root>card` div has a width of 200px with 24px padding on all sides, which means the content width is 200px - 48px = 152px.

The text "one two three four five six seven eight nine ten" needs to fit within this 152px width. With a font-size of 16px and line-height of 19.2px, the text wraps as shown in the screenshot.

Counting the lines in the screenshot:
1. "one two three"
2. "four five six"
3. "seven eight"
4. "nine ten"

The `getBoundingClientRect()` data for `root>card` shows height=124.75px. With line-height of 19.2px and padding of 24px top and bottom, the content height is approximately 124.75 - 48 = 76.75px. Dividing by line-height: 76.75 / 19.2 ≈ 4 lines.

ANSWER: 4
