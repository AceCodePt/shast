# topmost-of-three — opencode/gemini-3-flash

- arm: `shot`
- probes: paint order across three overlapping boxes at one point
- expected: root>middle (z-index 3, all three in the root context)
- parsed answer: `root>front`
- verdict: **FAIL (misread)**
- elapsed: 10963ms
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

In standard web rendering, elements that appear later in the DOM order are painted on top of their preceding siblings within the same stacking context. Since `root>front` is the last child in the node tree and all three boxes are stated to overlap at the point (120, 120), `root>front` resides at the top of the stack and is the element visible to the viewer.

ANSWER: root>front
