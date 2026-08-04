# text-transform — opencode/gemini-3-flash

- arm: `shot`
- probes: text that renders differently from the string in the source
- expected: ANNUAL REVIEW
- parsed answer: `ANNUAL REVIEW`
- verdict: **PASS**
- elapsed: 9559ms
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

The source text for the `root>title` node is "Annual review". However, the provided screenshot shows the text rendered in all uppercase letters as "ANNUAL REVIEW". This indicates that a CSS property like `text-transform: uppercase` has been applied to the element, changing its visual representation.

ANSWER: ANNUAL REVIEW
