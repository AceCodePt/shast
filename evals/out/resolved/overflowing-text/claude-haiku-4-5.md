# overflowing-text — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: content taller than a fixed height spills outside the box; it is not cut off
- expected: NO — four wrapped lines need 76.75px inside a 30px content box
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 9742ms

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

Let me analyze the report for `root>card`:

The border box has a height of 48px. To determine if the text fits, I need to account for the padding and border:
- Padding: 8px (top and bottom)
- Border-width: 1px (top and bottom)
- This leaves: 48px - 8px (padding) - 8px (padding) - 1px (border) - 1px (border) = 30px for content height

The report states the content is 153.61x76.75px inside a 162x30px content box. The content height is 76.75px, but the available content height is only 30px.

Since 76.75px > 30px, the text does not fit inside the border box. The report confirms this by noting "overflows: content is 153.61x76.75px inside a 162x30px content box, so it is painted outside the box rather than cut off (overflow is visible)."

ANSWER: NO
