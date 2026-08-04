# below-the-fold — opencode/qwen3.5-plus

- arm: `shot`
- probes: a node placed past the viewport's bottom edge
- expected: NO — it starts at y=700 in a 300px-tall viewport
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 14796ms
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

Looking at the evidence:

1. The viewport is 500x300 CSS pixels
2. The DOM has three elements: root, root>top (with text "masthead"), and root>footer (with text "footer note")
3. The screenshot shows only "masthead" at the top with white space below
4. The footer's text content ("footer note") is **not visible** in the screenshot

Since the footer element contains text but that text doesn't appear in the rendered screenshot of the initial viewport, the footer must be positioned outside the visible area—likely below the fold, requiring scrolling to see.

ANSWER: NO
