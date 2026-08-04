# union-coverage — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: two coverers that hide half a line each; neither alone would hide it
- expected: NO — together the two cover the whole line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 7292ms

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

Looking at the layout information provided:

The `root>line` div contains text and has a height of 19.19px. It's covered by two absolutely positioned divs:
- `root>leftHalf`: positioned at x=0, width=70px (covers left portion)
- `root>rightHalf`: positioned at x=60, width=80px (covers right portion, from x=60 to x=140)

The `root>line` div spans the full width of 400px. While neither covering box individually spans the whole line, together they create significant coverage:
- `root>leftHalf` covers x=0 to x=70 (left 17.5%)
- `root>rightHalf` covers x=60 to x=140 (overlapping in the middle, covering roughly x=60 to x=140, which is 20% of the 400px width)

Most importantly, the information explicitly states: "! covered: 1 of 1 text line(s) completely hidden"

This means the entire text line is completely hidden by the covering boxes. Even though the two boxes don't individually span the full width, together they completely obscure all the text content.

ANSWER: NO
