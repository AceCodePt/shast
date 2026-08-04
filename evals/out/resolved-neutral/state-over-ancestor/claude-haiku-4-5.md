# state-over-ancestor — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: a state delta on top of a three-level cascade, where the resting winner is not the node's own
- expected: 2px — the root's three-segment selector outranks the node's own :hover, so hovering changes nothing
- parsed answer: `2px`
- verdict: **PASS**
- elapsed: 7705ms

## Question

What padding does `root>mid>leaf` render with while the pointer is hovering over it?

## Context shown to the model


```
viewport 500x300
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root           div
  @ x=0 y=0 width=500 height=23.19

root>mid       div
  @ x=0 y=0 width=500 height=23.19

root>mid>leaf  div  "Leaf"
  @ x=0 y=0 width=500 height=23.19  dead-state
  = font-size: 16px (inherited), padding: 2px
  ! dead-state: `:hover` sets padding: 40px, but padding: 2px declared by root inside its "> mid > leaf" block outranks it — entering `:hover` does not change padding
  ← padding: 2px   declared by root, inside its "> mid > leaf" block   — shadows padding: 10px declared by root>mid, inside its "> leaf" block; also padding: 20px declared by root>mid>leaf itself, at the top of its css block
```

## Model reply

Looking at the information provided, I need to identify which padding rule applies to `root>mid>leaf` when the pointer is hovering over it.

The key insight is in the "dead-state" explanation: `:hover` sets `padding: 40px`, but `padding: 2px` declared by root inside its `"> mid > leaf"` block has higher specificity and outranks the `:hover` rule. The note explicitly states that "entering `:hover` does not change padding."

This is because the selector `root > mid > leaf` (which targets the element directly with tag selectors) has higher specificity than `:hover` applied to that same element. CSS specificity means that the more specific selector wins, regardless of the :hover pseudo-class.

Therefore, the `root>mid>leaf` element renders with the same padding whether or not the pointer is hovering over it, because the base rule (`padding: 2px`) shadows the hover rule (`padding: 40px`).

ANSWER: 2px
