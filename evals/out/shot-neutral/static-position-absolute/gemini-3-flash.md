# static-position-absolute — opencode/gemini-3-flash

- arm: `shot`
- probes: an absolutely positioned box with no offsets, which keeps its place
- expected: 50 — with all offsets `auto` the box stays at its static position, directly below the 50px spacer, rather than jumping to the top of the containing block
- parsed answer: `28`
- verdict: **FAIL (misread)**
- elapsed: 129192ms
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

To determine the y-coordinate of the top edge of `root>floaty`, we analyze the layout rules and the visual evidence provided:

1.  **Static Position of Absolutely Positioned Elements**: According to CSS specifications, an element with `position: absolute` that does not declare `top`, `right`, `bottom`, or `left` properties is placed at its **static position**. The static position is the location the element would have occupied if it were `position: static` in the normal document flow.

2.  **Document Flow and Block Elements**: 
    *   The `root>spacer` element is a `div`, which is a block-level element by default.
    *   The `root>floaty` element is also a `div`.
    *   In the normal flow, a block-level element following another block-level element starts on a new line, immediately below the preceding element's bottom edge.

3.  **Default Browser Styles (Chromium)**:
    *   Chromium applies a default margin of **8px** to the `body` element. In the screenshot, the text "spacer" is offset from the top and left edges by exactly this amount, confirming the 8px margin is present.
    *   The height of a `div` containing only text is determined by its `line-height`. In Chromium, the default font size is 16px, and the default `line-height` (typically `normal`, which is ~1.2) results in a line box height of approximately **20px** (or 18px-20px depending on the specific font).

4.  **Visual Measurement**:
    *   The top edge of the `root>spacer` box begins at **y = 8**.
    *   The distance between the top of the "spacer" text and the top of the "floaty" text in the screenshot is consistent with a line height of **20px**.
    *   Summing the top margin (8px) and the height of the first block (`spacer`, 20px) gives the starting y-coordinate for the next block.

Therefore, the top edge of the `root>floaty` element renders at y = 8 + 20 = 28.

ANSWER: 28
