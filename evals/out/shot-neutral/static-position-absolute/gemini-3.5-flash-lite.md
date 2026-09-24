# static-position-absolute — opencode/gemini-3.5-flash-lite

- arm: `shot`
- probes: an absolutely positioned box with no offsets, which keeps its place
- expected: 50 — with all offsets `auto` the box stays at its static position, directly below the 50px spacer, rather than jumping to the top of the containing block
- parsed answer: `16`
- verdict: **FAIL (misread)**
- elapsed: 10542ms
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

An absolutely positioned element with `auto` for all offset properties is placed at its static position, which is the position it would occupy in the normal document flow. Because `root>spacer` precedes `floaty` in the normal flow, `floaty` renders immediately below `spacer`. With standard browser defaults (16px font size and line height), `spacer` occupies 16px vertically, placing the top edge of `floaty` at y = 16.

ANSWER: 16
