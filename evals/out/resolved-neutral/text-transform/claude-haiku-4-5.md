# text-transform — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: text that renders differently from the string in the source
- expected: ANNUAL REVIEW
- parsed answer: `ANNUAL REVIEW`
- verdict: **PASS**
- elapsed: 7282ms

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

Looking at the information provided:

The `root>title` div contains the text "ANNUAL REVIEW" (written as "Annual review" in the source). The CSS property `text-transform: uppercase` is applied to the root div, which affects all its children including `root>title`.

The `text-transform: uppercase` property transforms all text to uppercase letters for display purposes. Therefore, even though the source text is written as "Annual review", the viewer sees it rendered in all uppercase due to the CSS transformation.

The viewport information confirms this is what's actually rendered in Chromium - the text-transform property is a visual CSS rule that affects how text is displayed to the viewer.

ANSWER: ANNUAL REVIEW
