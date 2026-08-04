# flex-grow-shares-remaining — opencode/claude-haiku-4-5

- arm: `shot`
- probes: flex-grow dividing the free space
- expected: 400 — the free 600px is split 1:2, so `root>b` gets two thirds
- parsed answer: `400`
- verdict: **PASS**
- elapsed: 6726ms
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

Looking at the provided information:

- `root` is a flex container with `display: flex` and a width of 600 CSS px
- `root>a` has `flex: 1`
- `root>b` has `flex: 2`

When flex items share space, they divide the available width according to their flex values. The total flex value is 1 + 2 = 3. Since `root>b` has a flex value of 2, it receives 2/3 of the total available width.

Calculation: (2 / 3) × 600 = 400 CSS px

ANSWER: 400
