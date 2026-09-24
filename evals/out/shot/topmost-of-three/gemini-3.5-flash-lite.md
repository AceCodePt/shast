# topmost-of-three — opencode/gemini-3.5-flash-lite

- arm: `shot`
- probes: paint order across three overlapping boxes at one point
- expected: root>middle (z-index 3, all three in the root context)
- parsed answer: `root>front`
- verdict: **FAIL (misread)**
- elapsed: 8924ms
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

In the Document Object Model (DOM), sibling elements are painted in the order they appear, with later elements rendered on top of earlier ones. Since `root>front` appears last among the three boxes (`back`, `middle`, `front`), it has the highest stacking order and occludes the others at overlapping points.

ANSWER: root>front
