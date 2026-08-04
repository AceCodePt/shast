# text-transform — opencode/qwen3.5-plus

- arm: `shot`
- probes: text that renders differently from the string in the source
- expected: ANNUAL REVIEW
- parsed answer: `ANNUAL REVIEW`
- verdict: **PASS**
- elapsed: 11915ms
- attached: `page.png`

## Question

Exactly what characters does a viewer see inside `root>title`?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 500x300

root        div
root>title  div  "Annual review"

Attached is a screenshot of the rendered page at 500x300 CSS px, at 1 device pixel per CSS px.
```

## Model reply

The node tree shows the source text is "Annual review", but the screenshot clearly displays "ANNUAL REVIEW" in all capital letters. CSS `text-transform: uppercase` has been applied to transform the rendered appearance. Since the question asks what a viewer **sees** (the rendered output, not the source), the visible characters are all uppercase.

ANSWER: ANNUAL REVIEW
