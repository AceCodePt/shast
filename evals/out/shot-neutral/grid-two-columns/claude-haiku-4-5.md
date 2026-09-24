# grid-two-columns — opencode/claude-haiku-4-5

- arm: `shot`
- probes: grid track placement with a gap
- expected: 220 — the first 200px track ends at x=200 and the 20px gap pushes the second track to x=220
- parsed answer: `220`
- verdict: **PASS**
- elapsed: 8880ms
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
- `root>left` occupies the first column (200px wide)
- `root>right` occupies the second column (300px wide)
- There is a 20px gap between the columns

The left edge of `root>right` starts after:
- The first column: 200px
- The gap: 20px
- Total: 200px + 20px = 220px

ANSWER: 220
