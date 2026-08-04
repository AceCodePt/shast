# z-index-scoped — opencode/qwen3.5-plus

- arm: `shot`
- probes: z-index is scoped to its stacking context, so a bigger number can still lose
- expected: root>high
- parsed answer: `root>high`
- verdict: **PASS**
- elapsed: 13430ms
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

Looking at the screenshot, I can see two overlapping rectangles:
- A blue rectangle with "inner" text in the top-left corner
- A red/pink rectangle with "high" text

In the region where they overlap, the red/pink rectangle is clearly visible on top of the blue rectangle. Since the node tree shows that `root>high` contains the text "high", and the red/pink area (which displays "high") is rendered above the blue area in the overlap region, `root>high` is the one a viewer sees.

ANSWER: root>high
