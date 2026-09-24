# text-transform — opencode/gemini-3-flash

- arm: `resolved`
- probes: text that renders differently from the string in the source
- expected: ANNUAL REVIEW
- parsed answer: `ANNUAL REVIEW`
- verdict: **PASS**
- elapsed: 11445ms

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

The `root` element has the property `text-transform: uppercase`, which is an inherited property in CSS. As a child of `root`, the `root>title` element inherits this transformation, which is applied to its written text ("Annual review"). The report confirms that the rendered result of this transformation is the string "ANNUAL REVIEW".

ANSWER: ANNUAL REVIEW
