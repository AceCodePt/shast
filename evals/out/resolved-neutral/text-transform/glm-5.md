# text-transform — opencode/glm-5

- arm: `resolved`
- probes: text that renders differently from the string in the source
- expected: ANNUAL REVIEW
- parsed answer: `ANNUAL REVIEW`
- verdict: **PASS**
- elapsed: 21910ms

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

The root div has `text-transform: uppercase`, and `text-transform` is an inherited property, so the `root>title` element inherits that uppercase transformation. While the source/written text is "Annual review", the viewer sees it rendered in uppercase as "ANNUAL REVIEW". This is confirmed by the rendering information showing the displayed text as "ANNUAL REVIEW" with the note that it was written as "Annual review".

ANSWER: ANNUAL REVIEW
