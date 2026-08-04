# padding-shrinks-content-box — opencode/glm-5

- arm: `resolved`
- probes: padding reducing the content width, and the wrapping that follows
- expected: 4 — the 200px box keeps its width and the 24px padding shrinks the content box to 152px
- parsed answer: `4`
- verdict: **PASS**
- elapsed: 14176ms

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

The report directly states the answer in the annotation marked `!` for `root>card`: "wrapped: text broke onto 4 lines at 152px content width". This is consistent with the measurements: the card is 200px wide with 24px padding on each side, giving a 152px content width; the total height of 124.75px minus the 48px of vertical padding leaves ~76.75px of content height, which divides evenly into 4 lines at roughly 19.2px each (a typical 16px font with ~1.2 line-height).

ANSWER: 4
