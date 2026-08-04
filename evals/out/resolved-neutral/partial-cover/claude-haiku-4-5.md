# partial-cover — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: a coverer that overlaps a box but misses its text hides nothing readable
- expected: NO — the chip sits to the right of and below the text line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 8937ms

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

Looking at the information provided:

The `root>chip` div is positioned absolutely at `x=400 y=60` with dimensions `width=160 height=40`, giving it a bounding box from x=400 to x=560 and y=60 to y=100.

The `root>row` p element spans from `x=0 y=0 width=600 height=120`, covering the full width and y=0 to y=120.

While `root>chip` does paint over part of `root>row` (the overlap region is x=400-560, y=60-100), the documentation explicitly states: "this node's 1 text line(s) stay fully visible". This means that although `root>chip` covers 9% of the `root>row` box's area, none of the actual text content of `root>row` is hidden by it.

ANSWER: NO
