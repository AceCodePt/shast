# static-position-absolute — opencode/gemini-3.5-flash-lite

- arm: `shot`
- probes: an absolutely positioned box with no offsets, which keeps its place
- expected: 50 — with all offsets `auto` the box stays at its static position, directly below the 50px spacer, rather than jumping to the top of the containing block
- parsed answer: `20`
- verdict: **FAIL (misread)**
- elapsed: 27590ms
- attached: `page.png`

## Question

`root>floaty` is `position: absolute` and declares no `top`, `right`, `bottom` or `left`. At what y does its top edge render?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root         div
root>spacer  div  "spacer"
root>floaty  div  "floaty"

Attached is a screenshot of the rendered page at 600x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

An absolutely positioned element with no offset properties (`top`, `right`, `bottom`, or `left`) specified renders at its static position, which is the position it would occupy in normal flow. In the normal document flow, `root>floaty` is placed immediately after the preceding block element `root>spacer`. With default browser styling (16px font size and normal line-height), the single line of text in `root>spacer` occupies 20 CSS pixels of vertical space. Consequently, `root>floaty` renders at a top edge of y = 20.

ANSWER: 20
