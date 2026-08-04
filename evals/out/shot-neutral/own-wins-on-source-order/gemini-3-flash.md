# own-wins-on-source-order — opencode/gemini-3-flash

- arm: `shot`
- probes: the inverse of dead-declaration: a node's own block sometimes does win
- expected: 64px — `&.big` ties on specificity and is printed later
- parsed answer: `50px`
- verdict: **FAIL (misread)**
- elapsed: 13964ms
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

The screenshot shows the text "Child" positioned with a clear, uniform offset from the top and left edges of the viewport. Given the viewport dimensions of 500x300 pixels, the gap between the edge and the text is approximately 50 pixels (about 1/10th of the total width). This visual spacing indicates that the `padding` applied to the `root>child` element is 50px.

ANSWER: 50px
