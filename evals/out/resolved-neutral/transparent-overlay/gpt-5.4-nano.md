# transparent-overlay — opencode/gpt-5.4-nano

- arm: `resolved`
- probes: the same geometry with a transparent coverer must NOT read as hidden
- expected: YES — the banner has no background, so the text shows through
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 8041ms

## Question

Can a person reading this page in a browser read the whole sentence in `root>lede`?

## Context shown to the model


```
viewport 600x400
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root         div
  @ x=0 y=0 width=600 height=300
  = position: relative, height: 300px

root>lede    p    "The quarterly results are in and every region beat its targ…" (72 chars)
  @ x=0 y=0 width=600 height=54.38  wrapped covered
  = font-size: 16px, padding: 8px
  ! wrapped: text broke onto 2 lines at 584px content width
  ! covered: root>banner <div> (absolute, z-index 5) paints later than this node over 100% of the box, but has no background, so what is behind it still shows through
  ! covered: this node's 2 text line(s) stay fully visible

root>body    p    "Details follow in the table below."
  @ x=0 y=54.38 width=600 height=35.19  covered
  = font-size: 16px (inherited), padding: 8px
  ! covered: root>banner <div> (absolute, z-index 5) paints later than this node over 44% of the box, but has no background, so what is behind it still shows through
  ! covered: this node's 1 text line(s) stay fully visible

root>banner  div
  @ x=0 y=0 width=600 height=70
  = position: absolute, top: 0px, left: 0px, width: 600px, height: 70px, z-index: 5
```

## Model reply

The `root>lede` paragraph has a computed box width of 600px and height of 54.38px, and Chromium reports that the text “wrapped” onto 2 lines at a content width of 584px. That means the sentence is fully present, just broken across two visible lines. Even though a later absolutely-positioned `root>banner` element overlaps parts of the box (and has no background), the tool notes that this node’s 2 lines “stay fully visible,” so the entire sentence remains readable.

ANSWER: YES
