# text-collision — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: two nodes drawing glyphs on the same pixels, with neither displaced nor covered
- expected: root>visible
- parsed answer: `root>visible`
- verdict: **PASS**
- elapsed: 10798ms

## Question

Which node's text is drawn on the same pixels as `root>ghost`'s text?

## Context shown to the model


```
viewport 400x300
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root          div
  @ x=0 y=0 width=400 height=19.19

root>ghost    div  "Important warning"
  @ x=0 y=0 width=0 height=0  wrapped overflows zero collides
  = font-size: 16px (inherited), height: 0px, width: 0px
  ! wrapped: text broke onto 2 lines at 0px content width
  ! overflows: content is 86.41x38.38px inside a 0x0px content box, so it is painted outside the box rather than cut off (overflow is visible)
  ! zero: 0x0px
  ! collides: root>visible <div> draws its text on the same pixels, over 56% of this node's glyphs

root>visible  div  "Everything is fine"
  @ x=0 y=0 width=400 height=19.19  collides
  = font-size: 16px (inherited)
  ! collides: root>ghost <div> draws its text on the same pixels, over 50% of this node's glyphs
```

## Model reply

Looking at the report, I need to find which node's text overlaps with `root>ghost`'s text.

The report states that `root>ghost` has a collision note:
- `! collides: root>visible <div> draws its text on the same pixels, over 56% of this node's glyphs`

This explicitly tells us that `root>visible` draws its text on the same pixels as `root>ghost`, with over 56% of `root>ghost`'s glyphs being covered.

This is further confirmed by the collision note on `root>visible`:
- `! collides: root>ghost <div> draws its text on the same pixels, over 50% of this node's glyphs`

Both nodes are positioned at the same coordinates (x=0, y=0) and the `root>ghost` node has zero dimensions (0x0px) with visible overflow, so its content bleeds out and overlaps with the `root>visible` node's text.

ANSWER: root>visible
