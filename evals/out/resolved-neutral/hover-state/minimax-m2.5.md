# hover-state — opencode/minimax-m2.5

- arm: `resolved`
- probes: reading a state delta without mistaking it for the resting style
- expected: #3355ff (or the same colour written any other way)
- parsed answer: `#3355ff`
- verdict: **PASS**
- elapsed: 6751ms

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

The default background colour is `#3355ff`. The `:hover` rule only applies when the pointer is over the element, so on initial paint without hover, the element uses its default `background-color`.

ANSWER: #3355ff
