# text-transform — opencode/qwen3.5-plus

- arm: `resolved`
- probes: text that renders differently from the string in the source
- expected: ANNUAL REVIEW
- parsed answer: `ANNUAL REVIEW`
- verdict: **PASS**
- elapsed: 12273ms

## Question

Exactly what characters does a viewer see inside `root>title`?

## Context shown to the model


```
viewport 500x300
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root        div
  @ x=0 y=0 width=500 height=19.19
  = text-transform: uppercase

root>title  div  "ANNUAL REVIEW"  (written "Annual review")
  @ x=0 y=0 width=500 height=19.19
  = font-size: 16px (inherited)
```

## Model reply

The report shows `root>title` is a div element with the content noted as `"ANNUAL REVIEW"` and clarifies it was `(written "Annual review")`. The parent `root` div has `text-transform: uppercase` applied. Since `text-transform: uppercase` is a presentational CSS property that transforms text visually without changing the underlying DOM content, the viewer sees the transformed uppercase version.

ANSWER: ANNUAL REVIEW
