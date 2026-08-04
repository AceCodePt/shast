# grid-two-columns — opencode/gpt-5.4-nano

- arm: `resolved`
- probes: grid track placement with a gap
- expected: 220 — the first 200px track ends at x=200 and the 20px gap pushes the second track to x=220
- parsed answer: `220`
- verdict: **PASS**
- elapsed: 7529ms

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

In a CSS grid, the `grid-template-columns` define the track widths in order, and `gap` adds spacing between adjacent tracks. The `left` column is 200px wide, so the `right` column starts after 200px. There is a 20px gap between the first and second columns, so `right`’s left edge is at `0 + 200 + 20 = 220` pixels.  

ANSWER: 220
