# containing-block-skips-static-parent — opencode/gpt-5.4-nano

- arm: `shot`
- probes: which ancestor an absolutely positioned box resolves against
- expected: 10,10 — `root>plain` is static and is skipped, so the offsets are measured from the root's padding edge at 0,0, not from `root>plain` at 20,20
- parsed answer: `0,0`
- verdict: **FAIL (misread)**
- elapsed: 9905ms
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

Because `root>plain` is not positioned, it remains in normal document flow: each `div` starts at the top-left of its parent’s content box. With default `div` styling (no margins/padding implied by the evidence), `root>plain>pin` therefore begins at the same top-left corner as the viewport content for its ancestor chain. So the top-left render point is at the origin in CSS pixels.

ANSWER: 0,0
