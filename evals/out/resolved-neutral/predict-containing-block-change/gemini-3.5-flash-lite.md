# predict-containing-block-change — opencode/gemini-3.5-flash-lite

- arm: `resolved`
- probes: the geometry that results from an edit, given only the page before it
- expected: 30,30 — `root>plain` becomes the containing block, so the 10px offsets are measured from its padding edge at 20,20 instead of the root's at 0,0
- parsed answer: `30,30`
- verdict: **PASS**
- elapsed: 18398ms

## Question

After that edit, at what x,y does the top-left corner of `root>plain>pin` render?

## Context shown to the model


```
viewport 600x400
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root            div
  @ x=0 y=0 width=600 height=100
  = position: relative, padding: 20px

root>plain      div
  @ x=20 y=20 width=560 height=60
  = padding: 30px

root>plain>pin  div  "pinned"
  @ x=10 y=10 width=80 height=20
  = font-size: 16px (inherited), position: absolute, top: 10px, left: 10px, width: 80px, height: 20px

The evidence above is the page exactly as it stands. Consider adding `position: relative` to `root>plain`'s css block. You are not shown a rendering of the outcome — work it out from the evidence.
```

## Model reply

When `root>plain` is given `position: relative`, it becomes the nearest positioned ancestor and thus the containing block for `root>plain>pin`. Absolute positioning is calculated relative to the padding edge of the containing block, which starts at `root>plain`'s top-left coordinates of `x=20, y=20`. Adding `top: 10px` and `left: 10px` to this origin places the top-left corner of `root>plain>pin` at `20 + 10 = 30` for both x and y.

ANSWER: 30,30
