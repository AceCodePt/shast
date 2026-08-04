# static-position-absolute — opencode/gpt-5.4-mini

- arm: `shot`
- probes: an absolutely positioned box with no offsets, which keeps its place
- expected: 50 — with all offsets `auto` the box stays at its static position, directly below the 50px spacer, rather than jumping to the top of the containing block
- parsed answer: `26`
- verdict: **FAIL (misread)**
- elapsed: 48851ms
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

`position: absolute` with all insets `auto` uses its static position, so `floaty` renders where it would have appeared in normal flow, directly after `spacer`. With the browser’s default `body` margin and one line of default text, that puts its top edge at about `y = 26px`.

ANSWER: 26
