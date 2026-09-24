# partial-cover — opencode/gpt-5.4-mini

- arm: `shot`
- probes: a coverer that overlaps a box but misses its text hides nothing readable
- expected: NO — the chip sits to the right of and below the text line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 6836ms
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

No. The `p` text “Short label” is fully visible at the top left, and the `chip` sits separately to the right with whitespace between them. Since there is no visible overlap with the row’s text, nothing from `root>row` is hidden.

ANSWER: NO
