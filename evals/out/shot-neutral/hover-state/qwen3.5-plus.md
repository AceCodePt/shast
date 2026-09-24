# hover-state — opencode/qwen3.5-plus

- arm: `shot`
- probes: reading a state delta without mistaking it for the resting style
- expected: #3355ff (or the same colour written any other way)
- parsed answer: `#4169E1`
- verdict: **FAIL (misread)**
- elapsed: 16300ms
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

Looking at the two screenshots:

1. **Rest state (first image)**: The `root>cta` div has a lighter, brighter blue background
2. **Hover state (second image)**: The same div has a noticeably darker, deeper blue background

The question asks for the background colour when the page is first painted and the pointer is elsewhere — that's the rest state. The visual shows a medium-bright blue, similar to a royal blue or primary blue shade.

ANSWER: #4169E1
