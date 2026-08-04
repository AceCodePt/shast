# containing-block-skips-static-parent — opencode/qwen3.5-plus

- arm: `shot`
- probes: which ancestor an absolutely positioned box resolves against
- expected: 10,10 — `root>plain` is static and is skipped, so the offsets are measured from the root's padding edge at 0,0, not from `root>plain` at 20,20
- parsed answer: `0,0`
- verdict: **FAIL (misread)**
- elapsed: 15686ms
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

Based on the information provided:

1. The viewport is 600x400 CSS pixels
2. The node tree shows `root>plain>pin` contains the text "pinned"
3. The screenshot shows "pinned" rendered at the top-left corner of the page
4. Since `root>plain` is not positioned, it doesn't create a new containing block, but this doesn't affect where the element renders visually
5. The screenshot clearly shows the text starting at the very top-left of the viewport with no visible offset

ANSWER: 0,0
