# stacked-overlays-still-readable — opencode/minimax-m2.5

- arm: `resolved`
- probes: coverage is not transitive: two coverers, and the text is still legible
- expected: YES — the transparent one hides nothing and the opaque one sits below the text line
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 7761ms

## Question

Two boxes paint over `root>line`. Can a viewer still read its text?

## Context shown to the model


```
viewport 400x300
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root        div
  @ x=0 y=0 width=400 height=200
  = position: relative, height: 200px

root>line   div  "Still readable"
  @ x=0 y=0 width=400 height=19.19  covered
  = font-size: 16px (inherited)
  ! covered: root>glass <div> (absolute, z-index 1) paints later than this node over 100% of the box, but has no background, so what is behind it still shows through
  ! covered: this node's 1 text line(s) stay fully visible

root>glass  div
  @ x=0 y=0 width=400 height=100  covered
  = position: absolute, top: 0px, left: 0px, width: 400px, height: 100px, z-index: 1
  ! covered: root>panel <div> (absolute, z-index 2) paints later than this node, with an opaque background, over 60% of the box

root>panel  div
  @ x=0 y=40 width=400 height=60
  = position: absolute, top: 40px, left: 0px, width: 400px, height: 60px, z-index: 2, background-color: #303030
```

## Model reply

The text in `root>line` sits at y=0–19.19 (the top text line). `root>glass` paints over it but has no background, so it doesn't obscure anything. `root>panel` has an opaque background but is positioned at y=40–100, which is entirely below the text line, so it doesn't cover the text. The coverage note for `root>line` also confirms "this node's 1 text line(s) stay fully visible."

ANSWER: YES
