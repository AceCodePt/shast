# text-transform — opencode/gpt-5.4-nano

- arm: `shot`
- probes: text that renders differently from the string in the source
- expected: ANNUAL REVIEW
- parsed answer: `Annual review`
- verdict: **FAIL (answer-line slip or no reply)**
- elapsed: 10043ms
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

The provided node-tree evidence is authoritative for what text is actually on screen, and it lists the text inside `root>title` as `"Annual review"` (with the page source escaping shown as `\"...\` in the evidence). Therefore, the viewer sees the characters `Annual review` with a space between the words.

ANSWER: Annual review
