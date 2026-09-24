# long-word-overflows — opencode/claude-haiku-4-5

- arm: `dom`
- probes: an unbreakable token wider than its box
- expected: NO — there is no break opportunity in the URL, so the single word runs to ~518px and is painted outside the box
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 8823ms

## Question

Does the URL in `root>cell` stay inside `root>cell`'s 120px-wide box?

## Context shown to the model


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
```

## Model reply

Looking at the information provided:

The `root>cell` div has a width of 120px and contains the text "https://example.com/a/very/long/path/that/never/breaks", which is approximately 66 characters long.

At a font-size of 16px with the default font, a URL of this length would typically require significantly more than 120 pixels of horizontal space to display without wrapping. The URL contains no spaces or natural break points (hyphens at word boundaries), so it cannot wrap and would overflow the container.

The computed styles show `overflow: visible` (not `hidden` or `auto`), meaning any content that exceeds the 120px width would render outside the box rather than being clipped or scrollable.

ANSWER: NO
