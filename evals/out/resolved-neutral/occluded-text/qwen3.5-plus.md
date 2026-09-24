# occluded-text — opencode/qwen3.5-plus

- arm: `resolved`
- probes: an opaque positioned box hides the text of an in-flow box under it
- expected: NO — the banner paints an opaque background over its lines
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 16817ms

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

Looking at the rendering information:

The `root>lede` paragraph contains the text "The quarterly results are in and every region beat its targ…" broken into 2 lines. However, the `root>banner` div is positioned absolutely at the same location (x=0, y=0), has a higher z-index (5), paints **later** than the lede node, and has an **opaque background** (#222222).

Critically, the annotation states the banner covers **100% of the box** and **2 of 2 text line(s) completely hidden**. This means the entire lede paragraph is obscured by the opaque banner.

ANSWER: NO
