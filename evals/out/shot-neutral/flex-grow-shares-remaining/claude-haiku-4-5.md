# flex-grow-shares-remaining — opencode/claude-haiku-4-5

- arm: `shot`
- probes: flex-grow dividing the free space
- expected: 400 — the free 600px is split 1:2, so `root>b` gets two thirds
- parsed answer: `400`
- verdict: **PASS**
- elapsed: 7000ms
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

Looking at the information provided:

- The viewport is 600px wide
- `root` is a flex container with `display: flex`
- `root>a` has `flex: 1`
- `root>b` has `flex: 2`

The `flex` property is shorthand for `flex-grow`, `flex-shrink`, and `flex-basis`. When using just a number like `flex: 1` and `flex: 2`, these represent the flex-grow values, and the elements share the available space proportionally.

The total flex-grow is 1 + 2 = 3. Since `root>b` has a flex-grow of 2, it gets 2/3 of the total width.

Calculation: 600px × (2/3) = 400px

ANSWER: 400
