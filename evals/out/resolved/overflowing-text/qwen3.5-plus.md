# overflowing-text — opencode/qwen3.5-plus

- arm: `resolved`
- probes: content taller than a fixed height spills outside the box; it is not cut off
- expected: NO — four wrapped lines need 76.75px inside a 30px content box
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 16364ms

## Question

Does all of `root>card`'s text fit inside `root>card`'s own 48px-tall border box?

## Context shown to the model


```
viewport 400x300
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root       div
  @ x=0 y=0 width=400 height=48

root>card  div  "Payment failed because the card on file expired last month."
  @ x=0 y=0 width=180 height=48  wrapped overflows
  = font-size: 16px (inherited), width: 180px, height: 48px, padding: 8px, border-width: 1px, border-style: solid
  ! wrapped: text broke onto 4 lines at 162px content width
  ! overflows: content is 153.61x76.75px inside a 162x30px content box, so it is painted outside the box rather than cut off (overflow is visible)
```

## Model reply

Looking at the report:

- `root>card` has a border box of **180x48px**
- With `padding: 8px` and `border-width: 1px`, the content box is **162x30px** (48 - 2×8 - 2×1 = 30)
- The report explicitly states the text content is **153.61x76.75px**
- The text height (76.75px) exceeds the content box height (30px) by more than double
- The report confirms: "overflows: content is 153.61x76.75px inside a 162x30px content box, so it is painted outside the box"

The text clearly does not fit within the 48px-tall border box.

ANSWER: NO
