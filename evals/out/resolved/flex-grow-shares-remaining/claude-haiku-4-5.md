# flex-grow-shares-remaining — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: flex-grow dividing the free space
- expected: 400 — the free 600px is split 1:2, so `root>b` gets two thirds
- parsed answer: `400`
- verdict: **PASS**
- elapsed: 7596ms

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

Looking at the report:

- `root` has a total width of 600 CSS px
- `root>a` has `flex: 1` and occupies 200 px
- `root>b` has `flex: 2` and occupies 400 px

Since `root` is a flex container with its children having flex values of 1 and 2, the available space is divided in a 1:2 ratio. With a total width of 600 px and a ratio of 1:2, the space is split into 3 parts (1+2=3). Each part equals 600÷3 = 200 px. Therefore, `root>b` with `flex: 2` gets 2 parts, which is 2 × 200 = 400 px.

This matches the measured width shown in the report for `root>b`.

ANSWER: 400
