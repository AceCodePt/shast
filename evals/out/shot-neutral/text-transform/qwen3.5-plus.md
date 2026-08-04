# text-transform — opencode/qwen3.5-plus

- arm: `shot`
- probes: text that renders differently from the string in the source
- expected: ANNUAL REVIEW
- parsed answer: `ANNUAL REVIEW`
- verdict: **PASS**
- elapsed: 10953ms
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

The source HTML shows the text as "Annual review" (mixed case), but the screenshot clearly displays "ANNUAL REVIEW" (all uppercase). The page path includes "text-transform", indicating CSS `text-transform: uppercase` is applied, which visually transforms the text without changing the source. The viewer sees the rendered result, not the source.

ANSWER: ANNUAL REVIEW
