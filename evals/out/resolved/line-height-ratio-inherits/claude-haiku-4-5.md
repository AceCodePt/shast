# line-height-ratio-inherits — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: a unitless line-height inheriting as a ratio rather than a length
- expected: 64 — the unitless 2 inherits as a ratio and re-resolves against 32px, rather than inheriting the root's computed 32px line box
- parsed answer: `64`
- verdict: **PASS**
- elapsed: 7238ms

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

Looking at the report, I need to determine the computed line-height for `root>big`.

The `root` element declares `line-height: 2`, which is a unitless value. According to CSS spec, unitless line-height values are multipliers that get inherited as-is to child elements.

So `root>big` inherits `line-height: 2` from its parent. Since `root>big` declares `font-size: 32px`, the computed line-height becomes: `2 × 32px = 64px`.

This matches the measured height in the report: `root>big` has `height=64`.

ANSWER: 64
