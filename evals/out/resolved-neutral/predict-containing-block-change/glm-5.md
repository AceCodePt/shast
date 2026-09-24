# predict-containing-block-change — opencode/glm-5

- arm: `resolved`
- probes: the geometry that results from an edit, given only the page before it
- expected: 30,30 — `root>plain` becomes the containing block, so the 10px offsets are measured from its padding edge at 20,20 instead of the root's at 0,0
- parsed answer: `30,30`
- verdict: **PASS**
- elapsed: 23907ms

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

## Reasoning

Currently `root>plain` is **statically** positioned, so the absolutely-positioned `root>plain>pin` uses the next positioned ancestor up the tree — `root` (which has `position: relative`). For an absolutely positioned element, the containing block is the **padding box** of that positioned ancestor.

- `root`'s padding box origin is at (0,0). With `top: 10px; left: 10px`, the pin lands at (10,10) — exactly the rendered evidence. This confirms the containing block is `root`.

After adding `position: relative` to `root>plain`, it becomes the nearest positioned ancestor, so it becomes the containing block instead. `root>plain`'s border box (and thus its padding box, since there's no border) sits at **x=20, y=20** (it lives inside `root`'s 20px padding). Adding `top: 10px; left: 10px` to that origin:

- x = 20 + 10 = 30
- y = 20 + 10 = 30

ANSWER: 30,30
