# text-transform — opencode/gpt-5.4-nano

- arm: `shot`
- probes: text that renders differently from the string in the source
- expected: ANNUAL REVIEW
- parsed answer: `Annual review`
- verdict: **FAIL (answer-line slip or no reply)**
- elapsed: 7798ms
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

The evidence shows a node at `root>title` with a `div` whose text content is explicitly given as `"Annual review"`. Those quotation marks are just part of how the text is reported in the node tree; the actual characters a viewer sees are the text itself. Therefore, the viewer sees `Annual review`.

ANSWER: Annual review
