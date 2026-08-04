# text-transform — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: text that renders differently from the string in the source
- expected: ANNUAL REVIEW
- parsed answer: `ANNUAL REVIEW`
- verdict: **PASS**
- elapsed: 8878ms

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

Looking at the report, the `root>title` element displays the text "ANNUAL REVIEW".

Here's my reasoning: The report explicitly states that `root>title` contains the text written as "Annual review" but shows "(written \"Annual review\")" to indicate the original input. However, the critical detail is the CSS style applied to the parent `root` element: `text-transform: uppercase`. This style transforms all text to uppercase letters. Since this is a machine-generated report describing the page "as it was actually rendered and measured," it shows the final, resolved result after CSS transformations are applied. The height and x,y coordinates are the actual rendered measurements, confirming this is the final rendered state. Therefore, what a viewer actually sees is the uppercase-transformed version of the text.

ANSWER: ANNUAL REVIEW
