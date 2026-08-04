# union-coverage — opencode/gemini-3-flash

- arm: `resolved`
- probes: two coverers that hide half a line each; neither alone would hide it
- expected: NO — together the two cover the whole line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 14364ms

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

The text "Hidden by two" is located at the start of `root>line` (x=0, y=0). While neither box spans the entire 400px width of the line, `root>leftHalf` (x=0 to x=70) and `root>rightHalf` (x=60 to x=140) overlap to form a continuous opaque cover from x=0 to x=140. The report explicitly confirms that this combined coverage results in the single text line being "completely hidden."

ANSWER: NO
