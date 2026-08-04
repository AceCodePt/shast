# union-coverage — opencode/qwen3.5-plus

- arm: `resolved`
- probes: two coverers that hide half a line each; neither alone would hide it
- expected: NO — together the two cover the whole line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 20714ms

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

Looking at the rendering information:

1. `root>line` contains the text "Hidden by two" and is positioned at x=0, y=0
2. Two absolutely positioned divs with opaque backgrounds paint over it:
   - `root>leftHalf`: covers x=0 to x=70 (18% of the line)
   - `root>rightHalf`: covers x=60 to x=140 (20% of the line)
3. Together they cover from x=0 to x=140, which is enough to cover the entire text content (the phrase "Hidden by two" is approximately 70-100px wide at 16px font)
4. Crucially, the data explicitly states: **"1 of 1 text line(s) completely hidden"**

The text is fully obscured by the combination of these two opaque divs, even though neither one alone spans the entire line width.

ANSWER: NO
