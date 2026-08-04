# provenance — opencode/qwen3.5-plus

- arm: `resolved`
- probes: naming the node that declared a property, not the node that has it
- expected: root
- parsed answer: `root`
- verdict: **PASS**
- elapsed: 13874ms

## Question

Which node's css block declares the `border-radius` that `root>body>panel` renders with?

## Context shown to the model


```
viewport 600x300
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root             div
  @ x=0 y=0 width=600 height=53.19

root>body        div
  @ x=0 y=0 width=600 height=53.19

root>body>panel  section  "Panel"
  @ x=0 y=0 width=600 height=53.19
  = font-size: 16px (inherited), border-width: 1px, border-style: solid, padding: 16px, border-radius: 12px
  ← padding: 16px   declared by root>body, inside its "> panel" block   (adds)
  ← border-radius: 12px   declared by root, inside its "> body > panel" block   (adds)
```

## Model reply

Looking at the report, the `root>body>panel` node shows its resolved styles with annotations indicating where each style was declared. The line for border-radius explicitly states:

`← border-radius: 12px   declared by root, inside its "> body > panel" block   (adds)`

This clearly indicates that the `border-radius` declaration comes from the `root` node's CSS block (specifically from a selector targeting `> body > panel` within root's styles).

ANSWER: root
