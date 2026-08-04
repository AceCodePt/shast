# transparent-overlay — opencode/gpt-5.4-nano

- arm: `resolved`
- probes: the same geometry with a transparent coverer must NOT read as hidden
- expected: YES — the banner has no background, so the text shows through
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 10469ms

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

The `root>lede` paragraph is 54.38px tall and it wraps onto 2 lines because the content width is limited (it breaks at 584px). The report also says the node’s 2 text line(s) stay fully visible, and that although `root>banner` is absolutely positioned with a higher z-index and paints later, it has no background, so it doesn’t visually obscure the text. Since all lines of the `root>lede` text remain fully visible, a reader can read the entire sentence.

ANSWER: YES
