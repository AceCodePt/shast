# largest-by-area — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: the winner on area is neither the widest nor the tallest, so grabbing one axis fails
- expected: root>square (48400px²; wide and tall are 36000px² each, and neither the widest nor the tallest box wins)
- parsed answer: `root>square`
- verdict: **PASS**
- elapsed: 7356ms

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

I need to calculate the area of each box by multiplying width × height.

**wide**: 600 × 60 = 36,000 px²

**tall**: 120 × 300 = 36,000 px²

**square**: 220 × 220 = 48,400 px²

The square box has an area of 48,400 square pixels, which is larger than both the wide box (36,000 px²) and the tall box (36,000 px²). Interestingly, the wide and tall boxes have equal areas despite their different dimensions.

ANSWER: root>square
