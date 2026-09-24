# below-the-fold — opencode/gemini-3-flash

- arm: `shot`
- probes: a node placed past the viewport's bottom edge
- expected: NO — it starts at y=700 in a 300px-tall viewport
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 9504ms
- attached: `page.png`

## Question

Is `root>footer` inside the area the viewer sees when the page first loads, before any scrolling?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 500x300

root         div
root>top     div  "masthead"
root>footer  div  "footer note"

Attached is a screenshot of the rendered page at 500x300 CSS px, at 1 device pixel per CSS px.
```

## Model reply

The provided screenshot shows the rendered page at the specified 500x300 viewport dimensions. While the "masthead" text from the `root>top` node is visible at the top, the "footer note" text associated with the `root>footer` node is not present in the image. This indicates that the `root>footer` node is positioned outside the initial visible area (below the fold).

ANSWER: NO
