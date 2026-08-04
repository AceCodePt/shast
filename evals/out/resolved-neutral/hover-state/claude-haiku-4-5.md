# hover-state — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: reading a state delta without mistaking it for the resting style
- expected: #3355ff (or the same colour written any other way)
- parsed answer: `#3355ff`
- verdict: **PASS**
- elapsed: 7410ms

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

Looking at the information provided about the rendered web page:

The `root>cta` div element has a `background-color: #3355ff` declared in its CSS style. This is the baseline background color that applies when the element is in its normal state.

The `:hover` pseudo-class rule specifies `background-color: #0022cc`, but this only applies when the pointer is hovering over the element. Since the question asks about when "the pointer is elsewhere," the `:hover` state is not active, so the element displays its default background color.

ANSWER: #3355ff
