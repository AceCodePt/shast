# partial-cover — opencode/gemini-3-flash

- arm: `shot`
- probes: a coverer that overlaps a box but misses its text hides nothing readable
- expected: NO — the chip sits to the right of and below the text line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 10469ms
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

The node `root>row` contains the text "Short label," which is rendered in the top-left corner of the viewport. While `root>chip` (the yellow box) may overlap the bounding box of the `root>row` element, the screenshot shows that the characters "Short label" are fully visible and unobstructed. The yellow chip is positioned to the right of the text, leaving all characters of `root>row` clearly legible.

ANSWER: NO
