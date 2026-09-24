# overflow-is-not-truncation — opencode/glm-5

- arm: `resolved`
- probes: overflowing text is still painted, not cut off
- expected: YES — overflow is visible, so the spilled line is still drawn
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 16424ms

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

The rendered info explicitly states that the overflow is **visible**, not hidden or clipped: "it is painted outside the box rather than cut off (overflow is visible)." Since the content (76.75px tall) exceeds the 30px content box but `overflow` defaults to `visible`, the overflowing text — including the last line below the bottom edge — is still painted on the page and readable.

ANSWER: YES
