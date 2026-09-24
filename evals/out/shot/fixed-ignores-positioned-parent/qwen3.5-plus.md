# fixed-ignores-positioned-parent — opencode/qwen3.5-plus

- arm: `shot`
- probes: a fixed box resolving against the viewport, not a positioned ancestor
- expected: 25,15 — a fixed box resolves against the viewport, so the positioned parent and its padding are both ignored
- parsed answer: `25,15`
- verdict: **PASS**
- elapsed: 12615ms
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

The key here is understanding how `position: fixed` works. A fixed element is positioned relative to the **viewport**, not relative to its parent element—regardless of the parent's positioning or padding.

Since `root>inner` has `position: fixed` with `top: 15px; left: 25px`, those values are measured directly from the viewport edges. The parent's 40px padding and `position: relative` have no effect on where the fixed element renders.

ANSWER: 25,15
