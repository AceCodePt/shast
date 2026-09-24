# partial-cover — opencode/claude-haiku-4-5

- arm: `shot`
- probes: a coverer that overlaps a box but misses its text hides nothing readable
- expected: NO — the chip sits to the right of and below the text line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 10733ms
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
- `root>chip` is a `<div>` element containing the text "chip"
- The screenshot shows "Short label" text in the upper left area
- The "chip" element (yellow box) is positioned in the upper right area

From the visual evidence, the yellow "chip" box is positioned to the right and does not overlap with the "Short label" text. The "Short label" text is completely visible and not hidden by the chip element.

ANSWER: NO
