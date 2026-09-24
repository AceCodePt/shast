# below-the-fold — opencode/gemini-3.5-flash-lite

- arm: `shot`
- probes: a node placed past the viewport's bottom edge
- expected: NO — it starts at y=700 in a 300px-tall viewport
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 10044ms
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

The viewport height is 300px, and the rendered screenshot shows only the masthead at the top with the footer positioned below the initial viewport height. Since the footer is located below the fold, it is not visible in the initial view before scrolling.

ANSWER: NO
