# text-collision — opencode/gpt-5.4-nano

- arm: `resolved`
- probes: two nodes drawing glyphs on the same pixels, with neither displaced nor covered
- expected: root>visible
- parsed answer: `root>visible  div  "Everything is fine"`
- verdict: **PASS**
- elapsed: 7908ms

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

Chromium’s layout report says `root>ghost` “draws its text on the same pixels” as `root>visible <div>`, with “over 56% of this node’s glyphs” overlapping. The only other node listed as colliding/overlapping with `root>ghost` is the `root>visible` div containing the text `"Everything is fine"`, so that node’s text is drawn on the same pixels.

ANSWER: root>visible  div  "Everything is fine"
