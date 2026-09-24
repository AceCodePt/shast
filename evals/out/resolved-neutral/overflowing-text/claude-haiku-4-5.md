# overflowing-text — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: content taller than a fixed height spills outside the box; it is not cut off
- expected: NO — four wrapped lines need 76.75px inside a 30px content box
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 7888ms

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

Looking at the information provided:

The `root>card` element has a border box height of 48px. However, the overflow information states that the content is 153.61x76.75px inside a 162x30px content box. This means the content height is 76.75px, which exceeds the available space.

The border box height of 48px includes padding (8px) and border (1px), leaving approximately 30px of content space (48 - 8 - 8 - 1 - 1 = 30px). Since the actual content is 76.75px tall and overflows are visible (not hidden), the text does not fit within the border box—it overflows and is painted outside the box.

ANSWER: NO
