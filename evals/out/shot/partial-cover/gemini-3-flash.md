# partial-cover — opencode/gemini-3-flash

- arm: `shot`
- probes: a coverer that overlaps a box but misses its text hides nothing readable
- expected: NO — the chip sits to the right of and below the text line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 10853ms
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

The screenshot shows that "Short label" (the text of `root>row`) is positioned in the top-left corner of the viewport, while the yellow box (the `root>chip` element) is positioned further to the right. There is no visual overlap between the yellow box and the characters of the "Short label" text. Since the text is fully visible and not obstructed by the chip element, no part of it is hidden.

ANSWER: NO
