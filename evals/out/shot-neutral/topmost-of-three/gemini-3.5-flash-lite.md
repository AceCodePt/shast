# topmost-of-three — opencode/gemini-3.5-flash-lite

- arm: `shot`
- probes: paint order across three overlapping boxes at one point
- expected: root>middle (z-index 3, all three in the root context)
- parsed answer: `root>front`
- verdict: **FAIL (answer-line slip or no reply)**
- elapsed: 7480ms
- attached: `page.png`

## Question

All three boxes overlap the point 120,120. Which one does a viewer actually see at that point?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 500x400

root         div
root>back    div
root>middle  div
root>front   div

Attached is a screenshot of the rendered page at 500x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

In standard document order, elements appearing later in the DOM tree are rendered on top of preceding elements. Since `root>front` is the last of the three box divs in the node tree, it is painted last and sits above `root>back` and `root>middle`. Therefore, at any overlapping point such as (120,120), the viewer sees the topmost element.

ANSWER: root>front
