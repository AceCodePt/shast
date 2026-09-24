# z-index-scoped — opencode/gpt-5.4-nano

- arm: `shot`
- probes: z-index is scoped to its stacking context, so a bigger number can still lose
- expected: root>high
- parsed answer: `root>high`
- verdict: **PASS**
- elapsed: 8527ms
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

In the screenshot, the overlapping area shows the red “high” rectangle on top of the blue “low → inner” rectangle. Since both elements are present in the DOM (`root>low>inner` and `root>high`) but the visible overlap is red, the viewer sees the node that is rendered above in the overlap region.

ANSWER: root>high
