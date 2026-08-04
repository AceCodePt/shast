# distractor-node — opencode/gpt-5.4-nano

- arm: `resolved`
- probes: answering about the node asked for, not the flagged one next to it
- expected: YES — only `root>first` is covered
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 7870ms

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

`root>cover` is an absolutely positioned `div` with an opaque black background covering the box from `y=0px` to `y=19px` (height `19px`). `root>second` starts at `y=19.19px` with height `19.19px`, which begins just below the covered region. Since the cover ends before the second paragraph’s text area begins, it is not reported as covered/hidden.

ANSWER: YES
