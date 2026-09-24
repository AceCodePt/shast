# grid-two-columns — opencode/gpt-5.4-nano

- arm: `shot`
- probes: grid track placement with a gap
- expected: 220 — the first 200px track ends at x=200 and the 20px gap pushes the second track to x=220
- parsed answer: `220`
- verdict: **PASS**
- elapsed: 10420ms
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

In a CSS grid with `grid-template-columns: 200px 300px` and `gap: 20px`, the first column occupies the first 200 CSS px starting at the grid container’s left edge (x = 0). The second column (`root>right`) begins after that first column width plus the gap. So its left edge renders at `200 + 20 = 220` CSS px.

ANSWER: 220
