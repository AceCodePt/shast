# text-transform — opencode/claude-haiku-4-5

- arm: `shot`
- probes: text that renders differently from the string in the source
- expected: ANNUAL REVIEW
- parsed answer: `ANNUAL REVIEW`
- verdict: **PASS**
- elapsed: 7618ms
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

The node tree shows that `root>title` is a `div` element with the text "Annual review" as written in the source. The screenshot confirms this, showing "ANNUAL REVIEW" displayed at the top of the page.

The question asks for the exact characters as a viewer sees them. While the source shows "Annual review" (with lowercase letters after the first 'A'), the rendered screenshot displays "ANNUAL REVIEW" in all uppercase. This indicates that CSS styling (likely `text-transform: uppercase`) is being applied to change the visual rendering of the text.

However, the node tree represents the source text, not the rendered text. The actual characters in the DOM are "Annual review", but what a viewer sees on screen is "ANNUAL REVIEW" due to CSS text transformation.

Since the question asks "Exactly what characters does a viewer see," the answer should be what is visually rendered:

ANSWER: ANNUAL REVIEW
