# zero-size — opencode/gemini-3-flash

- arm: `resolved`
- probes: a node that renders at no size while carrying content
- expected: YES — a 0x0 box does not clip; the text overflows it and is painted
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 12286ms

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

The report states that although the content box of `root>ghost` is 0x0, the content itself is 86.41x38.38px and is "painted outside the box rather than cut off" because the "overflow is visible." Furthermore, the collision warning confirms that this node "draws its text on the same pixels" as another element, explicitly indicating that the text is rendered on the page.

ANSWER: YES
