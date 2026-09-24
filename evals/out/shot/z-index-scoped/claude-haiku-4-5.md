# z-index-scoped — opencode/claude-haiku-4-5

- arm: `shot`
- probes: z-index is scoped to its stacking context, so a bigger number can still lose
- expected: root>high
- parsed answer: `root>high`
- verdict: **PASS**
- elapsed: 8531ms
- attached: `page.png`

## Question

`root>low>inner` and `root>high` overlap. Which of the two is the one a viewer sees in the overlapping region?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root            div
root>low        div
root>low>inner  div  "inner"
root>high       div  "high"

Attached is a screenshot of the rendered page at 600x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

Looking at the screenshot and the node tree information:

The screenshot shows a blue box labeled "inner" with a red box labeled "high" overlapping it. In the overlapping region, the red box from `root>high` is clearly visible on top of the blue box from `root>low>inner`.

This means that `root>high` has a higher stacking context (higher z-index) than `root>low>inner`, so it appears on top in the overlapping region. The viewer sees the red "high" element in the area where they overlap.

ANSWER: root>high
