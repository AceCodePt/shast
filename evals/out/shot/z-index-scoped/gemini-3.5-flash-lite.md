# z-index-scoped — opencode/gemini-3.5-flash-lite

- arm: `shot`
- probes: z-index is scoped to its stacking context, so a bigger number can still lose
- expected: root>high
- parsed answer: `root>high`
- verdict: **PASS**
- elapsed: 9065ms
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

In the document order, `root>high` appears after `root>low` (which contains `root>low>inner`) under the common parent `root`. Since they share the same stacking context and have default positioning, later siblings are painted on top of earlier ones. This is also visually confirmed by the screenshot, where the red `high` box visibly obscures the blue `inner` box in their overlapping region.

ANSWER: root>high
