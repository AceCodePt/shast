# padding-shrinks-content-box — opencode/minimax-m2.5

- arm: `resolved`
- probes: padding reducing the content width, and the wrapping that follows
- expected: 4 — the 200px box keeps its width and the 24px padding shrinks the content box to 152px
- parsed answer: `4`
- verdict: **PASS**
- elapsed: 5856ms

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

The report explicitly notes that the text inside `root>card` broke onto 4 lines at a 152px content width.

ANSWER: 4
