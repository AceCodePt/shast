# fixed-ignores-positioned-parent — opencode/claude-haiku-4-5

- arm: `shot`
- probes: a fixed box resolving against the viewport, not a positioned ancestor
- expected: 25,15 — a fixed box resolves against the viewport, so the positioned parent and its padding are both ignored
- parsed answer: `25,15`
- verdict: **PASS**
- elapsed: 7488ms
- attached: `page.png`

## Question

`root` is `position: relative` with 40px of padding, and `root>inner` is `position: fixed` with `top: 15px; left: 25px`. At what x,y does the top-left corner of `root>inner` render?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root        div
root>inner  div  "fixed"

Attached is a screenshot of the rendered page at 600x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

Looking at the rendered page information provided:

The viewport is 600x400. The `root>inner` element has `position: fixed` with `top: 15px; left: 25px`.

With `position: fixed`, an element is positioned relative to the viewport, not relative to its parent or any positioned ancestors. The `position: relative` and padding on the `root` parent have no effect on a fixed-positioned element.

The `left: 25px` means the left edge is 25px from the left edge of the viewport, and `top: 15px` means the top edge is 15px from the top edge of the viewport.

Therefore, the top-left corner of `root>inner` renders at coordinates (25, 15) in CSS pixels.

ANSWER: 25,15
