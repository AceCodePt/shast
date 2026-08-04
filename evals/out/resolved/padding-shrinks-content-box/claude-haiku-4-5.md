# padding-shrinks-content-box — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: padding reducing the content width, and the wrapping that follows
- expected: 4 — the 200px box keeps its width and the 24px padding shrinks the content box to 152px
- parsed answer: `4`
- verdict: **PASS**
- elapsed: 9801ms

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

Looking at the report, I need to find how many lines the text wraps onto.

The report explicitly states under the `root>card` div:
- `! wrapped: text broke onto 4 lines at 152px content width`

This is a direct statement about the wrapping behavior of the text inside that element.

My reasoning: The report includes a "wrapped" note that specifically tells us the text broke onto 4 lines. The content width is 152px (which comes from the 200px width minus 24px padding on each side = 152px usable content width). The text "one two three four five six seven eight nine ten" (10 words) couldn't fit on fewer lines given this constraint, so it wrapped across 4 lines.

ANSWER: 4
