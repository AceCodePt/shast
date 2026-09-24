# grid-two-columns — opencode/claude-haiku-4-5

- arm: `shot`
- probes: grid track placement with a gap
- expected: 220 — the first 200px track ends at x=200 and the 20px gap pushes the second track to x=220
- parsed answer: `220`
- verdict: **PASS**
- elapsed: 6963ms
- attached: `page.png`

## Question

`root` is `display: grid` with `grid-template-columns: 200px 300px` and `gap: 20px`. At what x does `root>right`'s left edge render?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root        div
root>left   div  "left"
root>right  div  "right"

Attached is a screenshot of the rendered page at 600x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

Looking at the grid layout:

- `root` is a grid container with `grid-template-columns: 200px 300px` and `gap: 20px`
- `root>left` is the first column item, which starts at x = 0 and spans 200px
- The gap is 20px wide
- `root>right` is the second column item, which starts after the first column and the gap

Therefore, `root>right`'s left edge renders at: 200px (first column) + 20px (gap) = 220px

ANSWER: 220
