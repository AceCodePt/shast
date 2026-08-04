# largest-by-area — opencode/glm-5

- arm: `resolved`
- probes: the winner on area is neither the widest nor the tallest, so grabbing one axis fails
- expected: root>square (48400px²; wide and tall are 36000px² each, and neither the widest nor the tallest box wins)
- parsed answer: `root>square`
- verdict: **PASS**
- elapsed: 7627ms

## Question

Which of the three boxes covers the largest area? Area, not width and not height.

## Context shown to the model


```
viewport 700x420
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root         div
  @ x=0 y=0 width=700 height=400
  = position: relative, height: 400px

root>wide    div  "wide"
  @ x=0 y=0 width=600 height=60
  = font-size: 16px (inherited), position: absolute, top: 0px, left: 0px, width: 600px, height: 60px

root>tall    div  "tall"
  @ x=0 y=80 width=120 height=300
  = font-size: 16px (inherited), position: absolute, top: 80px, left: 0px, width: 120px, height: 300px

root>square  div  "square"
  @ x=140 y=80 width=220 height=220
  = font-size: 16px (inherited), position: absolute, top: 80px, left: 140px, width: 220px, height: 220px
```

## Model reply

The square has the largest area: 220 × 220 = 48,400 px². Both "wide" (600 × 60 = 36,000) and "tall" (120 × 300 = 36,000) are smaller despite one being wider and the other taller.

ANSWER: root>square
