# text-transform — opencode/gpt-5.4-nano

- arm: `resolved`
- probes: text that renders differently from the string in the source
- expected: ANNUAL REVIEW
- parsed answer: `ANNUAL REVIEW`
- verdict: **PASS**
- elapsed: 11236ms

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

The rendered page shows that the `root` element applies `text-transform: uppercase`, meaning any title text is displayed in uppercase regardless of how it was originally written. The `root>title` node contains the written text `"Annual review"`, but Chromium reports the rendered string as `"ANNUAL REVIEW"`. Therefore, the viewer sees the uppercase version including the space.

ANSWER: ANNUAL REVIEW
