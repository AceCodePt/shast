# flex-grow-shares-remaining — opencode/gpt-5.4-nano

- arm: `shot`
- probes: flex-grow dividing the free space
- expected: 400 — the free 600px is split 1:2, so `root>b` gets two thirds
- parsed answer: `400`
- verdict: **PASS**
- elapsed: 11358ms
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

With `display: flex`, the children’s main-axis widths are determined by their flex-grow values when `flex-basis` is `0` (which it is for the shorthand `flex: <number>`). Here, `root>a` has `flex: 1` and `root>b` has `flex: 2`, so the total grow factor is `1 + 2 = 3`. The container’s width is the viewport width, `600px`, so `root>b` takes `2/3` of that: `(2/3) * 600 = 400`.

ANSWER: 400
