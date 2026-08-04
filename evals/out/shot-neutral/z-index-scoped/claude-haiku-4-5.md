# z-index-scoped — opencode/claude-haiku-4-5

- arm: `shot`
- probes: z-index is scoped to its stacking context, so a bigger number can still lose
- expected: root>high
- parsed answer: `root>high`
- verdict: **PASS**
- elapsed: 6963ms
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

Looking at the screenshot, the red box labeled "high" is visibly on top of the blue box labeled "inner" in the overlapping region. The red color completely covers the blue in the area where they overlap, meaning the red element is rendering above the blue element.

From the node tree, `root>high` corresponds to the red box, and `root>low>inner` corresponds to the blue box. Since the red box is what's visible on top in the overlapping region, `root>high` must have a higher z-index or stacking context that places it above `root>low>inner`.

ANSWER: root>high
