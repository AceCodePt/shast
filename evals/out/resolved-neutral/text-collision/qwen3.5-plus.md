# text-collision — opencode/qwen3.5-plus

- arm: `resolved`
- probes: two nodes drawing glyphs on the same pixels, with neither displaced nor covered
- expected: root>visible
- parsed answer: `root>visible`
- verdict: **PASS**
- elapsed: 13843ms

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

Looking at the collision information provided:

- `root>ghost` has a collision note stating: "root>visible <div> draws its text on the same pixels, over 56% of this node's glyphs"
- `root>visible` has a collision note stating: "root>ghost <div> draws its text on the same pixels, over 50% of this node's glyphs"

Both nodes are positioned at x=0 y=0, and since `root>ghost` has 0x0 dimensions with visible overflow, its text paints outside its box and overlaps with `root>visible`'s text.

ANSWER: root>visible
