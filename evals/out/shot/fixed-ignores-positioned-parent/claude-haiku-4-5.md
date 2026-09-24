# fixed-ignores-positioned-parent — opencode/claude-haiku-4-5

- arm: `shot`
- probes: a fixed box resolving against the viewport, not a positioned ancestor
- expected: 25,15 — a fixed box resolves against the viewport, so the positioned parent and its padding are both ignored
- parsed answer: `25,15`
- verdict: **PASS**
- elapsed: 5455ms
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

Looking at the rendered page information and the screenshot, I need to determine where the top-left corner of `root>inner` is positioned.

The key insight is understanding how `position: fixed` works: **fixed positioning places elements relative to the viewport, not relative to their parent's padding or positioning context.** 

Given:
- `root>inner` has `position: fixed` with `top: 15px; left: 25px`
- The parent `root` has `position: relative` with 40px padding

Since `root>inner` is fixed-positioned, the `top: 15px; left: 25px` values are calculated from the viewport origin (top-left corner of the viewport at 0,0), NOT from the parent element's padding edge.

Therefore, the top-left corner of `root>inner` renders at coordinates 25px from the left edge and 15px from the top edge of the viewport.

ANSWER: 25,15
