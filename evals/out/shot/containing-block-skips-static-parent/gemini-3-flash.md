# containing-block-skips-static-parent — opencode/gemini-3-flash

- arm: `shot`
- probes: which ancestor an absolutely positioned box resolves against
- expected: 10,10 — `root>plain` is static and is skipped, so the offsets are measured from the root's padding edge at 0,0, not from `root>plain` at 20,20
- parsed answer: `0,0`
- verdict: **FAIL (misread)**
- elapsed: 17811ms
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

The node tree indicates that `root>plain` is not positioned (`position: static`). In CSS, an absolutely positioned element's containing block is the nearest ancestor that is positioned (i.e., not `static`). Since `root>plain` is not positioned, the `pin` element (which the test name suggests is absolutely positioned) would skip its parent and be positioned relative to the next positioned ancestor or the initial containing block (the viewport). The screenshot shows the text "pinned" located at the extreme top-left corner of the 600x400 viewport, indicating no offsets or margins are applied to the `pin` element's top-left corner relative to the origin.

ANSWER: 0,0
