# line-height-ratio-inherits — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: a unitless line-height inheriting as a ratio rather than a length
- expected: 64 — the unitless 2 inherits as a ratio and re-resolves against 32px, rather than inheriting the root's computed 32px line box
- parsed answer: `64`
- verdict: **PASS**
- elapsed: 9449ms

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

Looking at the rendered output provided:

The `root>big` element has a border box height of 64px, as shown in the layout information: `@ x=0 y=32 width=600 height=64`.

The reasoning is straightforward: `root>big` declares `font-size: 32px` but doesn't declare a `line-height`. Since it doesn't explicitly set `line-height`, it inherits the value from its parent (`root`), which has `line-height: 2`. A unitless `line-height` value is multiplied by the element's own `font-size`, so `line-height: 2 × 32px = 64px`. This matches the rendered height shown in the layout data.

ANSWER: 64
