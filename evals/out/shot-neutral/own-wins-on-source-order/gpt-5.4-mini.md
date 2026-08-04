# own-wins-on-source-order — opencode/gpt-5.4-mini

- arm: `shot`
- probes: the inverse of dead-declaration: a node's own block sometimes does win
- expected: 64px — `&.big` ties on specificity and is printed later
- parsed answer: `48px`
- verdict: **FAIL (misread)**
- elapsed: 17329ms
- attached: `page.png`

## Question

Three different blocks declare `padding` for `root>child`. What padding does it actually render with?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 500x300

root        div
root>child  div  "Child"

Attached is a screenshot of the rendered page at 500x300 CSS px, at 1 device pixel per CSS px.
```

## Model reply

All three `padding` declarations have the same specificity, so the last one in source order wins. The screenshot shows the text inset by that final value, which is `48px`.

ANSWER: 48px
