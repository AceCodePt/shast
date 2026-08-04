# fixed-ignores-positioned-parent — opencode/gemini-3.5-flash-lite

- arm: `shot`
- probes: a fixed box resolving against the viewport, not a positioned ancestor
- expected: 25,15 — a fixed box resolves against the viewport, so the positioned parent and its padding are both ignored
- parsed answer: `25,15`
- verdict: **PASS**
- elapsed: 8045ms
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

An element with `position: fixed` is positioned relative to the viewport (the initial containing block) rather than any positioned ancestor, as `position: relative` does not create a containing block for fixed-position elements. With `top: 15px; left: 25px`, the fixed element is placed 25 pixels from the left edge and 15 pixels from the top edge of the viewport.

ANSWER: 25,15
