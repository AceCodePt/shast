# static-position-absolute — opencode/gemini-3-flash

- arm: `shot`
- probes: an absolutely positioned box with no offsets, which keeps its place
- expected: 50 — with all offsets `auto` the box stays at its static position, directly below the 50px spacer, rather than jumping to the top of the containing block
- parsed answer: `40`
- verdict: **FAIL (misread)**
- elapsed: 92396ms
- attached: `page.png`

## Question

`root>floaty` is `position: absolute` and declares no `top`, `right`, `bottom` or `left`. At what y does its top edge render?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root         div
root>spacer  div  "spacer"
root>floaty  div  "floaty"

Attached is a screenshot of the rendered page at 600x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

The `root>floaty` element is absolutely positioned but does not declare any offset properties (`top`, `right`, `bottom`, or `left`). According to CSS specifications, such an element renders at its **static position**, which is the position it would have occupied in the normal flow. Since both `spacer` and `floaty` are `div` elements, they are block-level by default, meaning `floaty` would naturally render immediately below `spacer`.

Analyzing the provided 600x400 screenshot, there is a visible margin (consistent with the standard 8px default) and a significant vertical gap between the lines. The text "floaty" appears at a y-coordinate approximately 1/10th of the way down the 400px height, which is 40px. This corresponds to an 8px top margin plus a 32px line-height for the `spacer` element (8 + 32 = 40). Thus, the top edge of `root>floaty` renders at y=40.

ANSWER: 40
