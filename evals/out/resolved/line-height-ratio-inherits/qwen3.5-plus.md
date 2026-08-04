# line-height-ratio-inherits — opencode/qwen3.5-plus

- arm: `resolved`
- probes: a unitless line-height inheriting as a ratio rather than a length
- expected: 64 — the unitless 2 inherits as a ratio and re-resolves against 32px, rather than inheriting the root's computed 32px line box
- parsed answer: `64`
- verdict: **PASS**
- elapsed: 12711ms

## Question

`root` declares `font-size: 16px` and `line-height: 2`. `root>big` declares `font-size: 32px` and nothing else. How tall does `root>big` render?

## Context shown to the model


```
viewport 600x400
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root        div
  @ x=0 y=0 width=600 height=96
  = font-size: 16px, line-height: 2

root>small  div  "small"
  @ x=0 y=0 width=600 height=32
  = font-size: 16px (inherited)

root>big    div  "big"
  @ x=0 y=32 width=600 height=64
  = font-size: 32px
```

## Model reply

Looking at the report, the `root>big` element's border box is explicitly measured as `@ x=0 y=32 width=600 height=64`. The height value in this measurement is already the final rendered height in CSS pixels.

The element starts at y=32 (right after `root>small` which is 32px tall) and has a measured height of 64px. While `root` declares `line-height: 2`, the actual rendered height is determined by the measurement provided in the report.

ANSWER: 64
