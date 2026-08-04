# overflow-is-not-truncation — opencode/minimax-m2.5

- arm: `resolved`
- probes: overflowing text is still painted, not cut off
- expected: YES — overflow is visible, so the spilled line is still drawn
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 18003ms

## Question

The last line of `root>card`'s text sits below the bottom edge of `root>card`. Is that last line still painted on the page, where a person could read it?

## Context shown to the model


```
viewport 400x300
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root       div
  @ x=0 y=0 width=400 height=48

root>card  div  "Payment failed because the card on file expired last month."
  @ x=0 y=0 width=180 height=48  wrapped overflows
  = font-size: 16px (inherited), width: 180px, height: 48px, padding: 8px, border-width: 1px, border-style: solid
  ! wrapped: text broke onto 4 lines at 162px content width
  ! overflows: content is 153.61x76.75px inside a 162x30px content box, so it is painted outside the box rather than cut off (overflow is visible)
```

## Model reply

The report explicitly states that `root>card` has overflow set to visible ("overflow is visible"), and that its content "is painted outside the box rather than cut off." The text extends to roughly y=85.75px (9px top padding/border + 76.75px content height), which sits well below the card's bottom edge at y=48, but still within the 300px viewport height. There is no indication that the `root` element (or any other ancestor) applies `overflow: hidden` or `clip`, so the overflowing content is rendered onto the page rather than clipped.

ANSWER: YES
