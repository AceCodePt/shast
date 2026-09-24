# below-the-fold — opencode/claude-haiku-4-5

- arm: `shot`
- probes: a node placed past the viewport's bottom edge
- expected: NO — it starts at y=700 in a 300px-tall viewport
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 6947ms
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

The viewport is 500x300 CSS pixels. The node tree shows:
- `root>top` contains "masthead"
- `root>footer` contains "footer note"

The screenshot shows only "masthead" text visible in the rendered page at 500x300. The footer is not visible in the initial viewport.

Since the footer element (`root>footer`) does not appear in the screenshot of the initial viewport, it must be positioned below the visible area. This is consistent with it being labeled as "below-the-fold" in the file path, which is a web design term for content that requires scrolling to view.

ANSWER: NO
