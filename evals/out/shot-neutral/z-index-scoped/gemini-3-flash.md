# z-index-scoped — opencode/gemini-3-flash

- arm: `shot`
- probes: z-index is scoped to its stacking context, so a bigger number can still lose
- expected: root>high
- parsed answer: `root>high`
- verdict: **PASS**
- elapsed: 7919ms
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

The screenshot shows a blue box containing the text "inner" and a red box containing the text "high". In the overlapping region, the red box ("high") is rendered on top of the blue box ("inner"), obscuring it. Based on the node tree, these correspond to `root>high` and `root>low>inner` respectively.

ANSWER: root>high
