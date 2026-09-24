# long-word-overflows — opencode/claude-haiku-4-5

- arm: `shot+dom`
- probes: an unbreakable token wider than its box
- expected: NO — there is no break opportunity in the URL, so the single word runs to ~518px and is painted outside the box
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 7240ms
- attached: `page.png`

## Question

Does the URL in `root>cell` stay inside `root>cell`'s 120px-wide box?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root       div
root>cell  div  "https://example.com/a/very/long/path/that/never/breaks"

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=600 height=19.1875
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

root>cell <div>
  getBoundingClientRect: x=0 y=0 width=120 height=19.1875
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  width: 120px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

Attached is a screenshot of the rendered page at 600x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

Looking at the information provided:

The `root>cell` div has a width of 120px, but the URL text "https://example.com/a/very/long/path/that/never/breaks" is displayed in the screenshot extending far beyond that 120px boundary. The screenshot clearly shows the URL text stretching across the full 600px viewport width, well outside the 120px-wide box that contains it.

The `getBoundingClientRect()` data shows `root>cell` has `width=120px`, but the actual rendered text overflows this constraint and is visible extending to the right in the screenshot. The `overflow: visible` CSS property on the element confirms that overflowing content would be displayed rather than clipped.

ANSWER: NO
