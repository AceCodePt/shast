# containing-block-skips-static-parent — opencode/gpt-5.4-mini

- arm: `shot`
- probes: which ancestor an absolutely positioned box resolves against
- expected: 10,10 — `root>plain` is static and is skipped, so the offsets are measured from the root's padding edge at 0,0, not from `root>plain` at 20,20
- parsed answer: `0,0`
- verdict: **FAIL (misread)**
- elapsed: 8502ms
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

Because `root>plain` is not positioned, it does not establish a containing block. So `root>plain>pin` skips it and positions relative to the nearest positioned ancestor, which in this case is the root at the viewport origin. The screenshot shows the text flush at the top-left corner.

ANSWER: 0,0
