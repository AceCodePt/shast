# partial-cover — opencode/claude-haiku-4-5

- arm: `shot`
- probes: a coverer that overlaps a box but misses its text hides nothing readable
- expected: NO — the chip sits to the right of and below the text line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 7123ms
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

- `root>row` contains a `<p>` element with the text "Short label"
- `root>chip` is a `<div>` element with the text "chip" that paints over part of `root>row`

From the screenshot, I can see that "Short label" appears in the upper left area, while the yellow "chip" element is positioned in the upper right area. The "chip" element visually overlaps the general area of `root>row`, but examining the actual text positions, the "Short label" text itself is fully visible and not obscured by the "chip" element.

The "chip" appears to be positioned to the right and below where the "Short label" text is rendered, so while the div elements may overlap spatially, the actual text content of `root>row` ("Short label") is not hidden.

ANSWER: NO
