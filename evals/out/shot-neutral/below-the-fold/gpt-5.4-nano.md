# below-the-fold — opencode/gpt-5.4-nano

- arm: `shot`
- probes: a node placed past the viewport's bottom edge
- expected: NO — it starts at y=700 in a 300px-tall viewport
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 8586ms
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

The viewport is only `500x300` CSS pixels, and the provided evidence of what’s actually visible corresponds to the top area showing the `"masthead"`. While `root>footer` exists in the DOM, there’s no indication that it appears within the initial viewport region before scrolling; instead, the screenshot content suggests only the top portion is in view.

ANSWER: NO
