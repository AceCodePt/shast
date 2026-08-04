# containing-block-skips-static-parent — opencode/gpt-5.4-nano

- arm: `resolved`
- probes: which ancestor an absolutely positioned box resolves against
- expected: 10,10 — `root>plain` is static and is skipped, so the offsets are measured from the root's padding edge at 0,0, not from `root>plain` at 20,20
- parsed answer: `60,60`
- verdict: **FAIL (misread)**
- elapsed: 9289ms

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

`root>plain` is a `div` with `padding: 30px`, and it is located at `@ x=20 y=20`. Since `root>plain` is not positioned, its padding establishes the content box offset for its children. The `root>plain>pin` element is `position: absolute` with `top: 10px` and `left: 10px`, so its top-left corner is offset from `root>plain`’s padding edge by `(10, 10)`.

Therefore, its page coordinates are:
- x = 20 + 30 + 10 = 60
- y = 20 + 30 + 10 = 60

ANSWER: 60,60
