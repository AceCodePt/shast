# partial-cover — opencode/gpt-5.4-nano

- arm: `shot`
- probes: a coverer that overlaps a box but misses its text hides nothing readable
- expected: NO — the chip sits to the right of and below the text line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 7089ms
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

The authoritative evidence is the rendered node tree plus the 600×400 screenshot. `root>row` contains the text `"Short label"`, and in the screenshot that text is visible on the page. The `root>chip` element (“chip”) appears elsewhere (top area) and does not cover any portion of the `"Short label"` text region. Therefore, none of `root>row`’s own text is hidden by `root>chip`.  

ANSWER: NO
