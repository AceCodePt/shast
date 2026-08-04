# long-word-overflows — opencode/qwen3.5-plus

- arm: `resolved`
- probes: an unbreakable token wider than its box
- expected: NO — there is no break opportunity in the URL, so the single word runs to ~518px and is painted outside the box
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 11000ms

## Question

Does the URL in `root>cell` stay inside `root>cell`'s 120px-wide box?

## Context shown to the model


```
viewport 600x400
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root       div
  @ x=0 y=0 width=600 height=19.19

root>cell  div  "https://example.com/a/very/long/path/that/never/breaks"
  @ x=0 y=0 width=120 height=19.19  overflows
  = width: 120px, font-size: 16px
  ! overflows: content is 518.41x19.19px inside a 120x19.19px content box, so it is painted outside the box rather than cut off (overflow is visible)
```

## Model reply

The report explicitly states that `root>cell` has a width of 120px, but the URL content inside it measures 518.41px wide. The report notes "overflows" and clarifies that "content is painted outside the box rather than cut off (overflow is visible)". This means the URL visually extends beyond the 120px boundary of its container.

ANSWER: NO
