# predict-containing-block-change — opencode/gpt-5.4-mini

- arm: `resolved`
- probes: the geometry that results from an edit, given only the page before it
- expected: 30,30 — `root>plain` becomes the containing block, so the 10px offsets are measured from its padding edge at 20,20 instead of the root's at 0,0
- parsed answer: `60,60`
- verdict: **FAIL (misread)**
- elapsed: 10127ms

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

Adding `position: relative` to `root>plain` makes it the containing block for the absolutely positioned `pin`. The offsets `top: 10px` and `left: 10px` are measured from `root>plain`’s padding box, whose top-left is at `x=20+30=50`, `y=20+30=50`.

So `pin` renders at `50+10, 50+10` = `60,60`.

ANSWER: 60,60
