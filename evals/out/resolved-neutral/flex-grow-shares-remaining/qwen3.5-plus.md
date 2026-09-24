# flex-grow-shares-remaining — opencode/qwen3.5-plus

- arm: `resolved`
- probes: flex-grow dividing the free space
- expected: 400 — the free 600px is split 1:2, so `root>b` gets two thirds
- parsed answer: `400`
- verdict: **PASS**
- elapsed: 12060ms

## Question

`root` is `display: flex`. `root>a` has `flex: 1` and `root>b` has `flex: 2`. How wide is `root>b`?

## Context shown to the model


```
viewport 600x400
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root    div
  @ x=0 y=0 width=600 height=19.19
  = display: flex

root>a  div  "A"
  @ x=0 y=0 width=200 height=19.19
  = font-size: 16px (inherited), flex: 1

root>b  div  "B"
  @ x=200 y=0 width=400 height=19.19
  = font-size: 16px (inherited), flex: 2
```

## Model reply

Looking at the rendered layout data:

The root flex container is 600px wide. With `flex: 1` and `flex: 2`, the two children divide the space in a 1:2 ratio. This means 3 total parts, so each part is 600/3 = 200px. Item A (flex: 1) gets 200px, and item B (flex: 2) gets 400px.

The rendered data confirms this: `root>b` has `width=400`.

ANSWER: 400
