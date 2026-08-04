# flex-grow-shares-remaining — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: flex-grow dividing the free space
- expected: 400 — the free 600px is split 1:2, so `root>b` gets two thirds
- parsed answer: `400`
- verdict: **PASS**
- elapsed: 8285ms

## Question

`root` is `display: flex`. `root>a` has `flex: 1` and `root>b` has `flex: 2`. How wide is `root>b`?

## Context shown to the model


```
viewport 600x400
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root    div
  @ x=0 y=0 width=600 height=19.19
  = display: flex

root>a  div  "A"
  @ x=0 y=0 width=200 height=19.19
  = font-size: 16px (inherited), flex: 1

root>b  div  "B"
  @ x=200 y=0 width=400 height=19.19
  = font-size: 16px (inherited), flex: 2
```

## Model reply

Looking at the layout information provided:

- `root` has a total width of 600 CSS pixels
- `root>a` has `flex: 1` and occupies 200 CSS pixels
- `root>b` has `flex: 2` and occupies 400 CSS pixels

In a flex container, flex items are sized proportionally based on their flex values. With `root>a` having `flex: 1` and `root>b` having `flex: 2`, the ratio is 1:2. This means `root>b` should receive twice the space of `root>a`.

Since the total available width is 600px, it's divided into 3 equal parts (1+2=3): each "flex unit" is 200px. Therefore, `root>a` gets 1 × 200px = 200px, and `root>b` gets 2 × 200px = 400px.

This matches exactly what the layout information shows in the border box measurements.

ANSWER: 400
