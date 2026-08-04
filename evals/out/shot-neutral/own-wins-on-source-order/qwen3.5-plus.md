# own-wins-on-source-order — opencode/qwen3.5-plus

- arm: `shot`
- probes: the inverse of dead-declaration: a node's own block sometimes does win
- expected: 64px — `&.big` ties on specificity and is printed later
- parsed answer: `50px`
- verdict: **FAIL (misread)**
- elapsed: 14233ms
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

Looking at the screenshot, I can see the text "Child" positioned within the viewport. The text appears to have consistent spacing from the edges of its container. By visually estimating the distance from the left edge of the viewport to where the text begins, and considering the 500x300 viewport size, the padding appears to be approximately 50 pixels on each side.

ANSWER: 50px
