# flex-grow-shares-remaining — opencode/gemini-3-flash

- arm: `shot`
- probes: flex-grow dividing the free space
- expected: 400 — the free 600px is split 1:2, so `root>b` gets two thirds
- parsed answer: `400`
- verdict: **PASS**
- elapsed: 13178ms
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

The container `root` occupies the full viewport width of 600px. The `flex: <number>` shorthand sets the `flex-grow` property to that number and the `flex-basis` to `0`, meaning the entire 600px of available space is distributed proportionally between the two children. With total flex factors of 3 (1 for `a` and 2 for `b`), each share is 200px (600 / 3), so `root>b` receives two shares.

ANSWER: 400
