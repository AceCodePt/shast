# long-word-overflows — opencode/gpt-5.4-nano

- arm: `resolved`
- probes: an unbreakable token wider than its box
- expected: NO — there is no break opportunity in the URL, so the single word runs to ~518px and is painted outside the box
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 8845ms

## Question

Does the URL in `root>cell` stay inside `root>cell`'s 120px-wide box?

## Context shown to the model


```
viewport 600x400
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root       div
  @ x=0 y=0 width=600 height=19.19

root>cell  div  "https://example.com/a/very/long/path/that/never/breaks"
  @ x=0 y=0 width=120 height=19.19  overflows
  = width: 120px, font-size: 16px
  ! overflows: content is 518.41x19.19px inside a 120x19.19px content box, so it is painted outside the box rather than cut off (overflow is visible)
```

## Model reply

The `root>cell` element has a computed painted/content box width of `120px`. The information explicitly says the URL “overflows” and that Chromium reports the content as `518.41x19.19px` inside a `120x19.19px` content box, and that overflow is visible (painted outside the box rather than cut off). Therefore, the URL does not stay confined within the 120px-wide box.

ANSWER: NO
