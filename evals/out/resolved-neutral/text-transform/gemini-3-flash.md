# text-transform — opencode/gemini-3-flash

- arm: `resolved`
- probes: text that renders differently from the string in the source
- expected: ANNUAL REVIEW
- parsed answer: `ANNUAL REVIEW`
- verdict: **PASS**
- elapsed: 8964ms

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

The information states that the text was written as "Annual review". However, the `root` element has the CSS property `text-transform: uppercase`, which is inherited by the `root>title` element. This property converts all characters to uppercase, as confirmed by the rendered text value "ANNUAL REVIEW" provided in the description.

ANSWER: ANNUAL REVIEW
