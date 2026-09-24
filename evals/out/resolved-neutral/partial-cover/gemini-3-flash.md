# partial-cover — opencode/gemini-3-flash

- arm: `resolved`
- probes: a coverer that overlaps a box but misses its text hides nothing readable
- expected: NO — the chip sits to the right of and below the text line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 9716ms

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

The information provided for `root>row` explicitly states that while `root>chip` paints over approximately 9% of its box, the node's one text line stays fully visible. Since the text line remains fully visible despite the partial overlap of the chip, no text is hidden.

ANSWER: NO
