# percent-height-indefinite — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: a percentage height whose containing block is indefinite
- expected: NO — `root>outer` has no declared height, so the percentage behaves as `auto` and `tall` is one line (~19px) against `filler`'s 60px
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 9018ms

## Question

`root>outer>tall` declares `height: 100%`. Is it taller than its sibling `root>outer>filler`?

## Context shown to the model


```
viewport 600x400
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root               div
  @ x=0 y=0 width=600 height=79.19

root>outer         div
  @ x=0 y=0 width=600 height=79.19

root>outer>filler  div  "a"
  @ x=0 y=0 width=600 height=60
  = font-size: 16px (inherited), height: 60px

root>outer>tall    div  "b"
  @ x=0 y=60 width=600 height=19.19
  = font-size: 16px (inherited), height: 100%
```

## Model reply

Looking at the layout information provided:

- `root>outer>filler` has a height of 60px (explicitly set)
- `root>outer>tall` has a height of 19.19px (the rendered result)

The `root>outer>tall` element declares `height: 100%`, which resolves to 100% of its parent `root>outer`. The parent `root>outer` has a total height of 79.19px. However, since `root>outer>tall` is a sibling that comes after `root>outer>filler`, the `100%` refers to the parent's full height (79.19px), but the element only renders at 19.19px. This discrepancy occurs because `root>outer>filler` takes up 60px of the parent's height, leaving only 19.19px of available space for the tall element (likely due to the parent not expanding or layout constraints).

Comparing the actual rendered heights:
- `root>outer>filler`: 60px
- `root>outer>tall`: 19.19px

The filler is taller than the tall element.

ANSWER: NO
