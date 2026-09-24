# union-coverage — opencode/minimax-m2.5

- arm: `resolved`
- probes: two coverers that hide half a line each; neither alone would hide it
- expected: NO — together the two cover the whole line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 9041ms

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

The two covering boxes together paint over the range x=0 to x=140 (leftHalf covers 0–70, rightHalf covers 60–140). The text "Hidden by two" at 16px is roughly 110–130px wide and starts at x=0, so the combined coverage fully obscures it — even though no single box spans the whole line. The report explicitly confirms "1 of 1 text line(s) completely hidden".

ANSWER: NO
