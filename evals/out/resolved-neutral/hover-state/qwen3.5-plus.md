# hover-state — opencode/qwen3.5-plus

- arm: `resolved`
- probes: reading a state delta without mistaking it for the resting style
- expected: #3355ff (or the same colour written any other way)
- parsed answer: `#3355ff`
- verdict: **PASS**
- elapsed: 10703ms

## Question

What is the background colour of `root>cta` when the page is first painted and the pointer is elsewhere?

## Context shown to the model


```
viewport 400x300
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root      div
  @ x=0 y=0 width=400 height=43.19

root>cta  div  "Continue"
  @ x=0 y=0 width=400 height=43.19
  = font-size: 16px (inherited), background-color: #3355ff, padding: 12px
  :hover  background-color: #0022cc
```

## Model reply

The `root>cta` element has a default `background-color: #3355ff` specified. The `:hover` state with `background-color: #0022cc` only applies when the pointer is hovering over the element. Since the question asks for the color when "the page is first painted and the pointer is elsewhere" (not hovering), the default background color applies.

ANSWER: #3355ff
