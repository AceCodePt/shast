# hover-state — opencode/qwen3.5-plus

- arm: `shot`
- probes: reading a state delta without mistaking it for the resting style
- expected: #3355ff
- parsed answer: `#4169E1 (or similar medium blue / royal blue)`
- verdict: **FAIL (misread)**
- elapsed: 14453ms
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

1. **First image (rest.png)**: Shows the page at rest with the `root>cta` element displaying a **lighter, medium blue** background
2. **Second image (hover.png)**: Shows the page during hover with the `root>cta` element displaying a **darker, more saturated blue** background

The question asks for the background colour when the page is first painted (at rest). The first screenshot shows the initial state before any hover interaction, where the `root>cta` div has a medium blue background that is noticeably lighter than the hover state.

ANSWER: #4169E1 (or similar medium blue / royal blue)
