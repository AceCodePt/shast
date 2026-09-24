# inherited-font-size — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: an effective text size that no line on the node declares
- expected: root>heading (30px inherited, against 22px declared)
- parsed answer: `root>heading`
- verdict: **PASS**
- elapsed: 5912ms

## Question

Which renders with larger text, `root>heading` or `root>caption`?

## Context shown to the model


```
viewport 500x300
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root          div
  @ x=0 y=0 width=500 height=62.39
  = font-size: 30px

root>heading  div  "Quarterly report"
  @ x=0 y=0 width=500 height=36
  = font-size: 30px (inherited)

root>caption  div  "Draft"
  @ x=0 y=36 width=500 height=26.39
  = font-size: 22px
```

## Model reply

Looking at the font sizes specified in the report:

- `root>heading` has `font-size: 30px`
- `root>caption` has `font-size: 22px`

Since 30px is larger than 22px, the `root>heading` element renders with larger text.

ANSWER: root>heading
