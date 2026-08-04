# text-transform — opencode/gpt-5.4-nano

- arm: `resolved`
- probes: text that renders differently from the string in the source
- expected: ANNUAL REVIEW
- parsed answer: `ANNUAL REVIEW`
- verdict: **PASS**
- elapsed: 7863ms

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

The report says `root>title` is a `div` that contains the text `"ANNUAL REVIEW"`. It also notes the text was “written `Annual review`”, and since `root` has `text-transform: uppercase`, the viewer sees the transformed uppercase version. Therefore, the exact characters are the uppercase letters and the space between the two words.

ANSWER: ANNUAL REVIEW
