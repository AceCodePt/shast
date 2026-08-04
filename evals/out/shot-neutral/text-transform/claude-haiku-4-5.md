# text-transform — opencode/claude-haiku-4-5

- arm: `shot`
- probes: text that renders differently from the string in the source
- expected: ANNUAL REVIEW
- parsed answer: `ANNUAL REVIEW`
- verdict: **PASS**
- elapsed: 7346ms
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

Looking at the information provided:

The node tree shows:
```
root>title  div  "Annual review"
```

This indicates that the `root>title` element is a `div` with the text content "Annual review" as written in the source.

The screenshot confirms this - it shows the text "ANNUAL REVIEW" displayed at the top of the page. However, the node tree explicitly states the text "as written in the source" is "Annual review" (with that specific capitalization).

The discrepancy between the source text "Annual review" and what appears on screen as "ANNUAL REVIEW" is due to CSS styling (likely `text-transform: uppercase` or similar), but the question asks for what characters a viewer sees, which would be the rendered uppercase version visible in the screenshot.

ANSWER: ANNUAL REVIEW
