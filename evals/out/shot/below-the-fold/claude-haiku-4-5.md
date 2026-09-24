# below-the-fold — opencode/claude-haiku-4-5

- arm: `shot`
- probes: a node placed past the viewport's bottom edge
- expected: NO — it starts at y=700 in a 300px-tall viewport
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 7365ms
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

Looking at the information provided:

- The viewport is 500x300 CSS pixels
- `root>top` contains "masthead" and is at the top of the page
- `root>footer` contains "footer note"

The screenshot shows only the "masthead" text visible in the viewport, with a large white space below it. The "footer note" is not visible in the rendered screenshot at 500x300 CSS px.

Since the footer is not visible in the initial viewport rendering and would require scrolling to see, it is below the fold - meaning it's not in the area the viewer sees when the page first loads.

ANSWER: NO
