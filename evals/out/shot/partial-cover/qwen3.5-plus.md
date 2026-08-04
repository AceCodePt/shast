# partial-cover — opencode/qwen3.5-plus

- arm: `shot`
- probes: a coverer that overlaps a box but misses its text hides nothing readable
- expected: NO — the chip sits to the right of and below the text line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 12223ms
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

Looking at the provided information:

- `root>row` is a `<p>` element containing the text "Short label"
- `root>chip` is a `<div>` containing the text "chip"
- The screenshot shows "Short label" in the top-left corner and "chip" on a yellow background positioned on the right side

The two elements occupy different regions of the page. The text "Short label" is fully visible in the top-left, while the chip element is positioned separately on the right. There is no overlap between the chip and the "Short label" text.

ANSWER: NO
