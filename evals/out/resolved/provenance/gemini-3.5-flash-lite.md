# provenance — opencode/gemini-3.5-flash-lite

- arm: `resolved`
- probes: naming the node that declared a property, not the node that has it
- expected: root
- parsed answer: `root`
- verdict: **PASS**
- elapsed: 10332ms

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

The report for `root>body>panel` explicitly indicates that `border-radius: 12px` was declared by `root` inside its `> body > panel` block. Therefore, the node whose CSS block contains the declaration is `root`.

ANSWER: root
