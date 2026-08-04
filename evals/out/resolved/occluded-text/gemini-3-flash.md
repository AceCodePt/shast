# occluded-text — opencode/gemini-3-flash

- arm: `resolved`
- probes: an opaque positioned box hides the text of an in-flow box under it
- expected: NO — the banner paints an opaque background over its lines
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 13954ms

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
  ! covered: root>banner <div> (absolute, z-index 5) paints later than this node, with an opaque background, over 100% of the box
  ! covered: 2 of 2 text line(s) completely hidden

root>body    p    "Details follow in the table below."
  @ x=0 y=54.38 width=600 height=35.19  covered
  = font-size: 16px (inherited), padding: 8px
  ! covered: root>banner <div> (absolute, z-index 5) paints later than this node, with an opaque background, over 44% of the box
  ! covered: 1 partly hidden (up to 40% of a line)

root>banner  div
  @ x=0 y=0 width=600 height=70
  = position: absolute, top: 0px, left: 0px, width: 600px, height: 70px, z-index: 5, background-color: #222222
```

## Model reply

The report indicates that the `root>lede` paragraph is entirely obscured by the `root>banner` element. The banner is positioned absolutely at the same coordinates (x=0, y=0) with a higher z-index and an opaque background, and the report explicitly states that it covers 100% of the lede's box. Consequently, all lines of text in the lede are marked as "completely hidden," making the sentence unreadable to a person.

ANSWER: NO
