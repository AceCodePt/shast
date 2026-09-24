# grid-two-columns — opencode/qwen3.5-plus

- arm: `resolved`
- probes: grid track placement with a gap
- expected: 220 — the first 200px track ends at x=200 and the 20px gap pushes the second track to x=220
- parsed answer: `220`
- verdict: **PASS**
- elapsed: 10689ms

## Question

`root` is `display: grid` with `grid-template-columns: 200px 300px` and `gap: 20px`. At what x does `root>right`'s left edge render?

## Context shown to the model


```
viewport 600x400
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root        div
  @ x=0 y=0 width=600 height=19.19
  = display: grid, grid-template-columns: 200px 300px, gap: 20px

root>left   div  "left"
  @ x=0 y=0 width=200 height=19.19
  = font-size: 16px (inherited)

root>right  div  "right"
  @ x=220 y=0 width=300 height=19.19
  = font-size: 16px (inherited)
```

## Model reply

The grid has two columns: the first is 200px wide, and there's a 20px gap between them. The `root>right` element starts after the first column (200px) plus the gap (20px), which equals 220px from the left edge.

ANSWER: 220
