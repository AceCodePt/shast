# predict-containing-block-change — opencode/gpt-5.4-nano

- arm: `resolved`
- probes: the geometry that results from an edit, given only the page before it
- expected: 30,30 — `root>plain` becomes the containing block, so the 10px offsets are measured from its padding edge at 20,20 instead of the root's at 0,0
- parsed answer: `30,30`
- verdict: **PASS**
- elapsed: 11761ms

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

`root` is already `position: relative`, so before the edit `root>plain>pin`’s `position: absolute; top: 10px; left: 10px` is resolved against the nearest positioned ancestor (`root`), which matches the current measured position `x=10, y=10`. After adding `position: relative` to `root>plain`, that becomes the nearest positioned ancestor, so the absolute offsets are applied relative to `root>plain`’s box at `x=20, y=20`. Therefore the pin’s top-left becomes `(20 + 10, 20 + 10)`.

ANSWER: 30,30
