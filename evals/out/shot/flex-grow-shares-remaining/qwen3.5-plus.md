# flex-grow-shares-remaining — opencode/qwen3.5-plus

- arm: `shot`
- probes: flex-grow dividing the free space
- expected: 400 — the free 600px is split 1:2, so `root>b` gets two thirds
- parsed answer: `400`
- verdict: **PASS**
- elapsed: 14240ms
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

Looking at the rendered page:

- The viewport is 600px wide
- `root` is a flex container with two children
- `root>a` has `flex: 1` and `root>b` has `flex: 2`

With flex shorthand values of 1 and 2, the flex-grow ratios are 1:2. This means the available space is divided into 3 parts (1+2=3), where A gets 1 part and B gets 2 parts.

Since B gets 2/3 of the 600px container width: 2/3 × 600 = 400px

ANSWER: 400
