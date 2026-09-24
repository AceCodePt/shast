# flex-grow-shares-remaining — opencode/gpt-5.4-nano

- arm: `resolved`
- probes: flex-grow dividing the free space
- expected: 400 — the free 600px is split 1:2, so `root>b` gets two thirds
- parsed answer: `400`
- verdict: **PASS**
- elapsed: 8352ms

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

`root` is a flex container with total width `600px`. In flex layout, items with `flex: 1` and `flex: 2` share remaining space in a `1:2` ratio, so `root>a` gets `1/3` of `600 = 200px`, and `root>b` gets `2/3` of `600 = 400px`. This also matches the rendered box dimensions shown (`root>b` width is `400`).  
ANSWER: 400
