# stacked-overlays-still-readable — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: coverage is not transitive: two coverers, and the text is still legible
- expected: YES — the transparent one hides nothing and the opaque one sits below the text line
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 7023ms

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

Looking at the report, I need to trace what paints over `root>line` and whether the text remains visible.

`root>line` is a text div at y=0 with height 19.19px containing "Still readable".

Two boxes paint over it:

1. **`root>glass`** (absolute, z-index 1): Covers the full area of `root>line` (x=0 y=0 width=400 height=100). However, the report explicitly states: "has no background, so what is behind it still shows through" and "this node's 1 text line(s) stay fully visible". So this transparent layer doesn't obscure the text.

2. **`root>panel`** (absolute, z-index 2): Positioned at y=40 with height=60, so it covers y=40 to y=100. Since `root>line` spans y=0 to y=19.19, the panel does NOT overlap with `root>line` at all.

The report explicitly confirms that the text of `root>line` "stay fully visible" despite being painted over by `root>glass`. Since `root>panel` doesn't even overlap with `root>line`, the text remains readable.

ANSWER: YES
