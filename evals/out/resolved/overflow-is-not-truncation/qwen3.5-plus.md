# overflow-is-not-truncation — opencode/qwen3.5-plus

- arm: `resolved`
- probes: overflowing text is still painted, not cut off
- expected: YES — overflow is visible, so the spilled line is still drawn
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 13683ms

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

The report states that `root>card` has a content box of 162x30px (after accounting for 8px padding and 1px border on each side), but the text content measures 153.61x76.75px. Crucially, the report explicitly notes that "overflow is visible" — meaning content that exceeds the box dimensions is painted outside the box rather than being clipped or hidden.

Since the overflow behavior is `visible`, the last line of text that sits below the bottom edge of `root>card` is still painted and would be readable by a person.

ANSWER: YES
