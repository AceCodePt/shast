# containing-block-skips-static-parent — opencode/qwen3.5-plus

- arm: `shot`
- probes: which ancestor an absolutely positioned box resolves against
- expected: 10,10 — `root>plain` is static and is skipped, so the offsets are measured from the root's padding edge at 0,0, not from `root>plain` at 20,20
- parsed answer: `8,8`
- verdict: **FAIL (misread)**
- elapsed: 15669ms
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

Looking at the screenshot, the word "pinned" appears at the very top-left corner of the viewport. Since `root>plain` is not positioned, it doesn't create a new containing block, so `root>plain>pin` renders in the normal document flow starting from the top-left of the viewport. The text appears to have a small offset from the absolute corner, consistent with default browser margins (typically 8px).

ANSWER: 8,8
