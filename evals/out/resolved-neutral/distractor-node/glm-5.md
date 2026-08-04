# distractor-node — opencode/glm-5

- arm: `resolved`
- probes: answering about the node asked for, not the flagged one next to it
- expected: YES — only `root>first` is covered
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 18807ms

## Question

Can a viewer read the text in `root>second`?

## Context shown to the model


```
viewport 500x300
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root         div
  @ x=0 y=0 width=500 height=250
  = position: relative, height: 250px

root>first   p    "First paragraph here"
  @ x=0 y=0 width=500 height=19.19  covered
  = font-size: 16px (inherited)
  ! covered: root>cover <div> (absolute) paints later than this node, with an opaque background, over 99% of the box
  ! covered: 1 of 1 text line(s) completely hidden

root>second  p    "Second paragraph here"
  @ x=0 y=19.19 width=500 height=19.19
  = font-size: 16px (inherited)

root>cover   div
  @ x=0 y=0 width=500 height=19
  = position: absolute, top: 0px, left: 0px, width: 500px, height: 19px, background-color: #000000
```

## Model reply

`root>second` sits at y=19.19 with height 19.19, while the opaque `root>cover` div spans y=0 to y=19 (height 19px). The cover therefore ends at y=19, which is just above where the second paragraph begins at y=19.19, leaving the second paragraph fully visible and uncovered.

ANSWER: YES
