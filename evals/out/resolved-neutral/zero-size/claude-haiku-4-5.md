# zero-size — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: a node that renders at no size while carrying content
- expected: YES — a 0x0 box does not clip; the text overflows it and is painted
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 7573ms

## Question

`root>ghost` renders at 0x0. Are the words "Important warning" nevertheless painted somewhere on the page?

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

Looking at the rendering information provided:

The `root>ghost` div has `width: 0px` and `height: 0px`, but the critical detail is in the "overflows" note: "content is 86.41x38.38px inside a 0x0px content box, so it is painted outside the box rather than cut off (overflow is visible)."

This means the text content of "Important warning" exceeds the bounds of its 0x0px container. Since the overflow property is set to visible (the default), the text is painted outside the box boundaries rather than being clipped. Additionally, the collision note confirms that the text from `root>ghost` is actually drawn on the page, overlapping with the `root>visible` div's text by over 56% of its glyphs.

ANSWER: YES
