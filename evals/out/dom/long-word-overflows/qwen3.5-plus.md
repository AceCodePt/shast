# long-word-overflows — opencode/qwen3.5-plus

- arm: `dom`
- probes: an unbreakable token wider than its box
- expected: NO — there is no break opportunity in the URL, so the single word runs to ~518px and is painted outside the box
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 16374ms

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

Looking at the evidence:

1. The `root>cell` div has a rendered width of **120px** (from `getBoundingClientRect`)
2. The text content is a continuous URL: `"https://example.com/a/very/long/path/that/never/breaks"` — approximately 54 characters with no natural break points
3. At `font-size: 16px`, this URL would naturally require roughly 400-500px of horizontal space
4. The computed style shows `overflow: visible`, meaning content is allowed to render outside the box bounds
5. There's no CSS property like `word-break`, `overflow-wrap`, or `text-overflow` that would force the text to wrap or clip

Since the URL is an unbreakable string much wider than 120px and `overflow: visible` allows it to paint outside its container, the text visually extends beyond the 120px box even though the box itself remains 120px wide.

ANSWER: NO
