# distractor-node — opencode/gemini-3.5-flash-lite

- arm: `resolved`
- probes: answering about the node asked for, not the flagged one next to it
- expected: YES — only `root>first` is covered
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 7608ms

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

`root>second` is positioned at `y=19.19` with a height of `19.19`, whereas `root>cover` occupies the vertical range from `y=0` to `19px` (covering only `root>first`). Because `root>second` lies completely outside `root>cover`'s bounding box and has no coverage warnings, its text is fully visible to a viewer.

ANSWER: YES
