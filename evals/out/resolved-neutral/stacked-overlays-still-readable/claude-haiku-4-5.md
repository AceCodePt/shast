# stacked-overlays-still-readable — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: coverage is not transitive: two coverers, and the text is still legible
- expected: YES — the transparent one hides nothing and the opaque one sits below the text line
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 9006ms

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

Let me analyze the rendering information provided:

**Reasoning:**

1. `root>line` contains text and is at z-index 0 (default, lowest layer).

2. `root>glass` paints over it with z-index 1, but the information explicitly states: "has no background, so what is behind it still shows through". This means the text remains visible through the glass layer.

3. `root>panel` paints on top with z-index 2 and has `background-color: #303030` (opaque dark background). However, `root>panel` is positioned at `top: 40px` with `height: 60px`, meaning it covers only from y=40 to y=100. Since `root>line` is at y=0 with height 19.19, the panel only covers the lower portion of the text area.

4. The information confirms: "this node's 1 text line(s) stay fully visible" - explicitly stating that the text of `root>line` remains fully visible despite the overlays.

The text is readable because the glass layer is transparent and the opaque panel only partially obscures the line (covering the bottom portion), but crucially, the rendering information confirms the text stays fully visible.

ANSWER: YES
