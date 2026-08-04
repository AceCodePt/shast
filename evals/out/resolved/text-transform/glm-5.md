# text-transform — opencode/glm-5

- arm: `resolved`
- probes: text that renders differently from the string in the source
- expected: ANNUAL REVIEW
- parsed answer: `ANNUAL REVIEW`
- verdict: **PASS**
- elapsed: 13256ms

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

The report shows `root>title` with the displayed text `"ANNUAL REVIEW"` (written `"Annual review"`). The parenthetical "(written ...)" indicates the original source text, while the first quoted string is what is actually rendered. The `text-transform: uppercase` on `root` is inherited and applied, converting "Annual review" to its uppercase form for display.

ANSWER: ANNUAL REVIEW
