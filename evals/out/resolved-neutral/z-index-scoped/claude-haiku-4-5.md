# z-index-scoped — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: z-index is scoped to its stacking context, so a bigger number can still lose
- expected: root>high
- parsed answer: `root>high`
- verdict: **PASS**
- elapsed: 9150ms

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

Looking at the information provided:

The `root>high` div is the one a viewer sees in the overlapping region. 

Here's the reasoning: Although `root>low>inner` has a z-index of 999, this z-index is **scoped to the stacking context of its parent `root>low`**. The entire `root>low` stacking context (which includes `root>low>inner`) has an implicit z-index that is lower than `root>high`'s z-index of 2. The information explicitly states: "the smaller z-index still wins here because this node's z-index 999 is scoped to the stacking context of root>low, and that whole context paints below root>high". This means `root>high` paints later and appears on top of the overlapping region.

ANSWER: root>high
