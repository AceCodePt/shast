# flex-grow-shares-remaining — opencode/qwen3.5-plus

- arm: `shot`
- probes: flex-grow dividing the free space
- expected: 400 — the free 600px is split 1:2, so `root>b` gets two thirds
- parsed answer: `400`
- verdict: **PASS**
- elapsed: 16005ms
- attached: `page.png`

## Question

`root` is `display: flex`. `root>a` has `flex: 1` and `root>b` has `flex: 2`. How wide is `root>b`?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root    div
root>a  div  "A"
root>b  div  "B"

Attached is a screenshot of the rendered page at 600x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

In a flex container with `display: flex` (default row direction), when children have `flex: 1` and `flex: 2` with no specified basis, they default to `flex-basis: 0%`. This means the available space (600px viewport width) is distributed according to the flex-grow ratios.

Total flex-grow units = 1 + 2 = 3. Element B has 2 units, so it gets 2/3 of the available width.

2/3 × 600px = 400px

ANSWER: 400
