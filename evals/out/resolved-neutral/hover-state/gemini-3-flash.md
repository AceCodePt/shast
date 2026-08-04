# hover-state — opencode/gemini-3-flash

- arm: `resolved`
- probes: reading a state delta without mistaking it for the resting style
- expected: #3355ff (or the same colour written any other way)
- parsed answer: `#3355ff`
- verdict: **PASS**
- elapsed: 9154ms

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

The information provided for `root>cta` specifies a default `background-color` of `#3355ff`. While a `:hover` state is defined with `#0022cc`, the question describes the initial paint with the pointer elsewhere, meaning the hover pseudo-class is not active. Therefore, the element will display its base background color.

ANSWER: #3355ff
