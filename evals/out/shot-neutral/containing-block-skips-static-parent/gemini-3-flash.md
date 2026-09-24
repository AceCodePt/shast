# containing-block-skips-static-parent — opencode/gemini-3-flash

- arm: `shot`
- probes: which ancestor an absolutely positioned box resolves against
- expected: 10,10 — `root>plain` is static and is skipped, so the offsets are measured from the root's padding edge at 0,0, not from `root>plain` at 20,20
- parsed answer: `0,0`
- verdict: **FAIL (misread)**
- elapsed: 12014ms
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

The screenshot shows the text "pinned," which is the content of the `root>plain>pin` element, rendered at the top-left corner of the viewport. Because `root>plain` is explicitly stated to be not positioned, it does not serve as a containing block for any absolute positioning; the element `root>plain>pin` therefore defaults to the flow or the initial containing block. The visual evidence confirms that the top-left corner of the element is at the origin of the coordinate system.

ANSWER: 0,0
