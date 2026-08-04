# union-coverage — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: two coverers that hide half a line each; neither alone would hide it
- expected: NO — together the two cover the whole line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 7389ms

## Question

Can a viewer read the words in `root>line`? Note that neither covering box on its own spans the whole line.

## Context shown to the model


```
viewport 400x300
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root            div
  @ x=0 y=0 width=400 height=200
  = position: relative, height: 200px

root>line       div  "Hidden by two"
  @ x=0 y=0 width=400 height=19.19  covered
  = font-size: 16px (inherited)
  ! covered: root>leftHalf <div> (absolute) paints later than this node, with an opaque background, over 18% of the box
  ! covered: root>rightHalf <div> (absolute) paints later than this node, with an opaque background, over 20% of the box
  ! covered: 1 of 1 text line(s) completely hidden

root>leftHalf   div
  @ x=0 y=0 width=70 height=20  covered
  = position: absolute, top: 0px, left: 0px, width: 70px, height: 20px, background-color: #101010
  ! covered: root>rightHalf <div> (absolute) paints later than this node, with an opaque background, over 14% of the box

root>rightHalf  div
  @ x=60 y=0 width=80 height=20
  = position: absolute, top: 0px, left: 60px, width: 80px, height: 20px, background-color: #202020
```

## Model reply

Let me analyze the coverage information provided in the report.

The `root>line` element has a width of 400px and contains text. Two absolute-positioned divs are covering it:

1. `root>leftHalf`: positioned at x=0, width=70px, covering 18% of the box
2. `root>rightHalf`: positioned at x=60, width=80px, covering 20% of the box

The key information is in the report: "! covered: 1 of 1 text line(s) completely hidden"

This explicitly states that the single text line in `root>line` is completely hidden. Even though neither covering box spans the whole line individually, together they cover the entire line, hiding all the text.

Additionally, the report notes that `root>line` is marked as "covered" overall, indicating that the text content is not visible to a viewer.

ANSWER: NO
