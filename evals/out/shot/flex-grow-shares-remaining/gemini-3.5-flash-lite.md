# flex-grow-shares-remaining — opencode/gemini-3.5-flash-lite

- arm: `shot`
- probes: flex-grow dividing the free space
- expected: 400 — the free 600px is split 1:2, so `root>b` gets two thirds
- parsed answer: `400`
- verdict: **PASS**
- elapsed: 10016ms
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

The flex container `root` spans the entire 600px width of the viewport. With `flex: 1` on `root>a` and `flex: 2` on `root>b`, the available width is distributed proportionally based on their flex-grow factors (1 and 2, summing to 3). Consequently, `root>b` receives two-thirds of the total 600px width.

ANSWER: 400
