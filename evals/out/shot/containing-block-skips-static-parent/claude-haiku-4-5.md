# containing-block-skips-static-parent — opencode/claude-haiku-4-5

- arm: `shot`
- probes: which ancestor an absolutely positioned box resolves against
- expected: 10,10 — `root>plain` is static and is skipped, so the offsets are measured from the root's padding edge at 0,0, not from `root>plain` at 20,20
- parsed answer: `0,0`
- verdict: **FAIL (misread)**
- elapsed: 6635ms
- attached: `page.png`

## Question

At what x,y does the top-left corner of `root>plain>pin` render? Note that `root>plain` is not positioned.

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root            div
root>plain      div
root>plain>pin  div  "pinned"

Attached is a screenshot of the rendered page at 600x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

Looking at the information provided:

1. The viewport is 600x400 CSS pixels
2. The node tree shows: `root > plain > pin` containing the text "pinned"
3. `root>plain` is explicitly stated as "not positioned" (meaning it's in normal document flow)
4. The screenshot shows "pinned" text appearing in the upper-left area of the page

Since `root>plain` is not positioned, it flows normally from the top-left of its parent (`root`). The `pin` div, being a child of `root>plain` which starts at the top-left, will also start rendering from the top-left of the viewport.

From the screenshot, the text "pinned" appears to start at the top-left corner of the rendered page with some minimal margin/padding, which in CSS typically defaults to 0,0 for the top-left corner when no explicit positioning or margins are applied.

ANSWER: 0,0
