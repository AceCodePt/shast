# containing-block-skips-static-parent — opencode/gpt-5.4-nano

- arm: `shot`
- probes: which ancestor an absolutely positioned box resolves against
- expected: 10,10 — `root>plain` is static and is skipped, so the offsets are measured from the root's padding edge at 0,0, not from `root>plain` at 20,20
- parsed answer: `8,8`
- verdict: **FAIL (misread)**
- elapsed: 9349ms
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

Since `root>plain` is not positioned, the nested `root>plain>pin` follows normal document flow inside its parent. With no stated CSS offsets, the top-left of `root>plain>pin` lands at the start of the outermost content area, which (in a typical browser default) is offset by the page’s default body margin. The screenshot shows `pinned` starting just a few pixels from the top-left, consistent with an 8px margin on both axes.

ANSWER: 8,8
