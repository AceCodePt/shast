# own-wins-on-source-order — opencode/gemini-3.5-flash-lite

- arm: `shot`
- probes: the inverse of dead-declaration: a node's own block sometimes does win
- expected: 64px — `&.big` ties on specificity and is printed later
- parsed answer: `30px`
- verdict: **FAIL (misread)**
- elapsed: 13073ms
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

When multiple style blocks declare the same property with equal specificity and cascade origin, CSS cascade rules dictate that source order prevails, meaning the last declared rule wins. Since three different blocks declare `padding` and source order determines precedence, the final (third) block's declaration wins and is rendered.

ANSWER: 30px
