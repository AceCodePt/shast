# hover-state — opencode/gemini-3-flash

- arm: `shot`
- probes: reading a state delta without mistaking it for the resting style
- expected: #3355ff
- parsed answer: `blue`
- verdict: **FAIL (misread)**
- elapsed: 24111ms
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

The node tree identifies the `root>cta` element as the one containing the text "Continue". By comparing the two screenshots, we can see that in `rest.png` (the page at rest), the element at the top of the viewport has a vibrant blue background. In `hover.png`, this same area transitions to a darker blue shade when the pointer hovers over the element, confirming that the initial background color is the lighter blue seen in the first image.

ANSWER: blue
