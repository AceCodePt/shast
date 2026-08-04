# own-wins-on-source-order — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: the inverse of dead-declaration: a node's own block sometimes does win
- expected: 64px — `&.big` ties on specificity and is printed later
- parsed answer: `64px`
- verdict: **PASS**
- elapsed: 8142ms

## Question

Three different blocks declare `padding` for `root>child`. What padding does it actually render with?

## Context shown to the model


```
viewport 500x300
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root        div
  @ x=0 y=0 width=500 height=147.19

root>child  div  "Child"
  @ x=0 y=0 width=500 height=147.19
  = font-size: 16px (inherited), padding: 64px
  ← padding: 64px   declared by root>child itself, inside its "&.big" block   — shadows padding: 4px declared by root, inside its "> child" block; also padding: 32px declared by root>child itself, at the top of its css block
```

## Model reply

Looking at the report, three padding declarations are listed for `root>child`:

1. `padding: 32px` - declared by `root>child` itself, at the top of its CSS block
2. `padding: 4px` - declared by `root`, inside its `> child` block
3. `padding: 64px` - declared by `root>child` itself, inside its `&.big` block

The report explicitly states that the third declaration "shadows" the first two. In CSS, when multiple declarations apply to the same property, the one with the highest specificity wins, and if specificity is equal, the last one in source order wins.

The `&.big` block selector (matching `root>child.big`) has higher specificity than either a simple element selector or a child combinator selector. Additionally, the report indicates it's the final declaration that applies.

The measured box shows `padding: 64px` in the rendered output, confirming this is what actually renders.

ANSWER: 64px
