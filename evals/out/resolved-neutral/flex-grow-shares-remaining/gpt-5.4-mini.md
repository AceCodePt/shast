# flex-grow-shares-remaining — opencode/gpt-5.4-mini

- arm: `resolved`
- probes: flex-grow dividing the free space
- expected: 400 — the free 600px is split 1:2, so `root>b` gets two thirds
- parsed answer: `400`
- verdict: **PASS**
- elapsed: 6783ms

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

`root>b` is `400px` wide.

Reasoning: the flex container is `600px` wide total, and the two children split the available space in a `1:2` ratio. That means `root>b` gets `2/3` of `600px`, which is `400px`. The rendered box confirms this.

ANSWER: 400
