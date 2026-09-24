# containing-block-skips-static-parent — opencode/claude-haiku-4-5

- arm: `shot`
- probes: which ancestor an absolutely positioned box resolves against
- expected: 10,10 — `root>plain` is static and is skipped, so the offsets are measured from the root's padding edge at 0,0, not from `root>plain` at 20,20
- parsed answer: `0,0`
- verdict: **FAIL (misread)**
- elapsed: 7042ms
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

Looking at the provided information:

1. The viewport is 600x400 CSS pixels
2. We have a nested structure: `root` > `root>plain` > `root>plain>pin`
3. The question states that `root>plain` is **not positioned**, meaning it follows normal document flow
4. The screenshot shows the text "pinned" in the top-left area of the page
5. Since `root>plain` is not positioned, it doesn't establish a new stacking context or offset
6. The `root>plain>pin` div contains the text "pinned" which appears at the top-left of the rendered page

Given that `root>plain` is not positioned (so it's in normal flow with no offset), and `root` is the root div that typically starts at (0,0), the `root>plain>pin` element's top-left corner renders at the natural starting position of the content.

From the screenshot, the text "pinned" appears to start at the top-left corner of the viewport, which in CSS pixels would be at coordinates (0, 0).

ANSWER: 0,0
