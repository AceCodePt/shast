# partial-cover — opencode/qwen3.5-plus

- arm: `shot`
- probes: a coverer that overlaps a box but misses its text hides nothing readable
- expected: NO — the chip sits to the right of and below the text line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 12984ms
- attached: `page.png`

## Question

`root>chip` paints over part of `root>row`. Is any of `root>row`'s own text hidden by it?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root       div
root>row   p    "Short label"
root>chip  div  "chip"

Attached is a screenshot of the rendered page at 600x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

Looking at the screenshot and the node tree information:

- `root>row` is a `<p>` element containing the text "Short label"
- `root>chip` is a `<div>` containing the text "chip" with a yellow background

In the rendered image at 600x400, the "Short label" text appears in the top-left corner and is fully visible. The yellow "chip" element is positioned on the right side of the viewport and does not overlap with the "Short label" text at all.

Since the text "Short label" from `root>row` is completely visible with no part obscured by the `root>chip` element, none of its own text is hidden.

ANSWER: NO
