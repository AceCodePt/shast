# hover-state — opencode/gpt-5.4-mini

- arm: `shot`
- probes: reading a state delta without mistaking it for the resting style
- expected: #3355ff
- parsed answer: `blue`
- verdict: **FAIL (misread)**
- elapsed: 8869ms
- attached: `rest.png`, `hover.png`

## Question

What is the background colour of `root>cta` when the page is first painted and the pointer is elsewhere?

## Context shown to the model

![rest.png](rest.png)
![hover.png](hover.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 400x300

root      div
root>cta  div  "Continue"

Two screenshots of the rendered page are attached, both 400x300 CSS px at 1 device pixel per CSS px: first the page at rest, then the page while the mouse hovers `root>cta`. Compare them.
```

## Model reply

`root>cta` is blue when first painted, matching the rest-state screenshot. The hover screenshot shows it becomes a darker blue, so the initial background is the lighter blue.

ANSWER: blue
