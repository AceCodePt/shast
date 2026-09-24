# z-index-scoped — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: z-index is scoped to its stacking context, so a bigger number can still lose
- expected: root>high
- parsed answer: `root>high`
- verdict: **PASS**
- elapsed: 8810ms

## Question

`root>low>inner` and `root>high` overlap. Which of the two is the one a viewer sees in the overlapping region?

## Context shown to the model


```
viewport 600x400
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root            div
  @ x=0 y=0 width=600 height=300
  = position: relative, height: 300px

root>low        div
  @ x=0 y=0 width=300 height=200  covered
  = position: absolute, top: 0px, left: 0px, width: 300px, height: 200px, z-index: 1, background-color: #eeeeee
  ! covered: root>high <div> (absolute, z-index 2) paints later than this node, with an opaque background, over 42% of the box

root>low>inner  div  "inner"
  @ x=10 y=10 width=280 height=180  covered
  = font-size: 16px (inherited), position: absolute, top: 10px, left: 10px, width: 280px, height: 180px, z-index: 999, background-color: #3355ff
  ! covered: root>high <div> (absolute, z-index 2) paints later than this node, with an opaque background, over 48% of the box — the smaller z-index still wins here because this node's z-index 999 is scoped to the stacking context of root>low, and that whole context paints below root>high
  ! covered: this node's 1 text line(s) stay fully visible
  ← position: absolute, top: 10px, left: 10px, width: 280px, height: 180px, z-index: 999, background-color: #3355ff   declared by root>low, inside its "> inner" block   (adds)

root>high       div  "high"
  @ x=50 y=50 width=300 height=100
  = font-size: 16px (inherited), position: absolute, top: 50px, left: 50px, width: 300px, height: 100px, z-index: 2, background-color: #ff3355
```

## Model reply

Looking at the report, I need to analyze the stacking context and z-index values.

The key insight is in the explanation for `root>low>inner`:

> "the smaller z-index still wins here because this node's z-index 999 is scoped to the stacking context of root>low, and that whole context paints below root>high"

This explains the critical concept: `root>low>inner` has z-index 999, but this z-index is **scoped to the stacking context of its parent `root>low`**. The parent `root>low` itself has z-index 1, which establishes a new stacking context. Since `root>high` has z-index 2 at the root level (not scoped within `root>low`), the entire `root>low` stacking context (including `root>low>inner` with its z-index 999) paints below `root>high`.

In other words, even though `root>low>inner` has a high z-index of 999, it cannot paint above `root>high` because it's constrained within its parent's stacking context, which has a lower z-index (1) than `root>high` (2).

ANSWER: root>high
