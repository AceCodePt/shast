# partial-cover — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: a coverer that overlaps a box but misses its text hides nothing readable
- expected: NO — the chip sits to the right of and below the text line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 7290ms

## Question

`root>chip` paints over part of `root>row`. Is any of `root>row`'s own text hidden by it?

## Context shown to the model


```
viewport 600x400
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root       div
  @ x=0 y=0 width=600 height=300
  = position: relative, height: 300px

root>row   p    "Short label"
  @ x=0 y=0 width=600 height=120  covered
  = font-size: 16px (inherited), padding: 4px, height: 120px
  ! covered: root>chip <div> (absolute) paints later than this node, with an opaque background, over 9% of the box
  ! covered: this node's 1 text line(s) stay fully visible

root>chip  div  "chip"
  @ x=400 y=60 width=160 height=40
  = font-size: 16px (inherited), position: absolute, top: 60px, left: 400px, width: 160px, height: 40px, background-color: #ffcc00
```

## Model reply

Looking at the report, I need to determine if `root>chip` hides any of `root>row`'s text.

The key information is in the coverage note for `root>row`:
- `root>chip` covers 9% of `root>row`'s box
- However, the report explicitly states: "this node's 1 text line(s) stay fully visible"

This means that while `root>chip` does paint over part of `root>row`'s border box (covering 9% of it), the text content itself remains fully visible—it's not obscured by `root>chip`.

ANSWER: NO
