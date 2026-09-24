# provenance — opencode/glm-5

- arm: `resolved`
- probes: naming the node that declared a property, not the node that has it
- expected: root
- parsed answer: `root`
- verdict: **PASS**
- elapsed: 15121ms

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

The report's annotation for the `border-radius` on `root>body>panel` states it was "declared by root, inside its '> body > panel' block." This means the declaration originates from the CSS block belonging to the `root` node, targeting its descendant panel through that child-chain selector.

ANSWER: root
