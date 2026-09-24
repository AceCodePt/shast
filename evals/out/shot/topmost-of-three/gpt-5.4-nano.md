# topmost-of-three — opencode/gpt-5.4-nano

- arm: `shot`
- probes: paint order across three overlapping boxes at one point
- expected: root>middle (z-index 3, all three in the root context)
- parsed answer: `root>front`
- verdict: **FAIL (misread)**
- elapsed: 7182ms
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

At the overlap point (120,120), only the topmost element in the stacking order will be visible; the evidence says all three boxes overlap that point but doesn’t indicate any partial coverage, so one box must be on top. Given the page’s three layers are labeled `back`, `middle`, and `front`, the viewer would see the `front` box at the shared overlapping region.

ANSWER: root>front
