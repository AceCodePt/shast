# flex-grow-shares-remaining — opencode/gemini-3-flash

- arm: `shot`
- probes: flex-grow dividing the free space
- expected: 400 — the free 600px is split 1:2, so `root>b` gets two thirds
- parsed answer: `400`
- verdict: **PASS**
- elapsed: 14502ms
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

The `root` element is a flex container with a total width of 600px. The children use the `flex: <number>` shorthand, which sets `flex-grow` to the specified number and `flex-basis` to `0%`. This means the entire width of the container is distributed based on the flex-grow ratios. With `root>a` having a flex factor of 1 and `root>b` having a flex factor of 2, the total units are 3. `root>b` therefore occupies 2/3 of the total width.

Calculation: (2 / 3) * 600px = 400px.

ANSWER: 400
