# padding-shrinks-content-box — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: padding reducing the content width, and the wrapping that follows
- expected: 4 — the 200px box keeps its width and the 24px padding shrinks the content box to 152px
- parsed answer: `4`
- verdict: **PASS**
- elapsed: 6301ms

## Question

How many lines does the text inside `root>card` wrap onto?

## Context shown to the model


```
viewport 600x400
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root       div
  @ x=0 y=0 width=600 height=124.75

root>card  div  "one two three four five six seven eight nine ten"
  @ x=0 y=0 width=200 height=124.75  wrapped
  = width: 200px, padding: 24px, font-size: 16px
  ! wrapped: text broke onto 4 lines at 152px content width
```

## Model reply

Looking at the information provided, the `root>card` div has a note that says "wrapped: text broke onto 4 lines at 152px content width". This directly tells us how many lines the text wraps onto.

The div has a width of 200px with 24px padding on each side, which gives a content width of 152px (200 - 24 - 24 = 152px). The text "one two three four five six seven eight nine ten" broke onto 4 lines within this constrained width.

ANSWER: 4
