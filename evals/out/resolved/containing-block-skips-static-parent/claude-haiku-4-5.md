# containing-block-skips-static-parent — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: which ancestor an absolutely positioned box resolves against
- expected: 10,10 — `root>plain` is static and is skipped, so the offsets are measured from the root's padding edge at 0,0, not from `root>plain` at 20,20
- parsed answer: `10,10`
- verdict: **PASS**
- elapsed: 8351ms

## Question

At what x,y does the top-left corner of `root>plain>pin` render? Note that `root>plain` is not positioned.

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
```

## Model reply

Looking at the report, I need to find where the top-left corner of `root>plain>pin` renders.

The report directly states that `root>plain>pin` has `@ x=10 y=10 width=80 height=20`. The `@` notation indicates the border box position in absolute CSS pixels from the top-left of the page.

The key detail is that `root>plain>pin` has `position: absolute` with `top: 10px` and `left: 10px`. Since `root>plain` is explicitly noted as "not positioned," the absolutely positioned element `root>plain>pin` uses `root` (which has `position: relative`) as its positioning context. The `top: 10px` and `left: 10px` values position it 10 pixels from the top and left edges of that relative-positioned ancestor.

The report confirms this by showing the absolute coordinates: x=10, y=10.

ANSWER: 10,10
