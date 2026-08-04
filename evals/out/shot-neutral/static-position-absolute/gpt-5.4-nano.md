# static-position-absolute — opencode/gpt-5.4-nano

- arm: `shot`
- probes: an absolutely positioned box with no offsets, which keeps its place
- expected: 50 — with all offsets `auto` the box stays at its static position, directly below the 50px spacer, rather than jumping to the top of the containing block
- parsed answer: `200`
- verdict: **FAIL (misread)**
- elapsed: 15751ms
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

For an absolutely positioned element, if `top`/`left` (or the corresponding insets) are not specified (i.e., they remain `auto`), it is placed at its *static position*—the position it would have had in normal document flow—then taken out of flow. Here, `root>floaty` comes after `root>spacer`, so its top edge renders directly below the spacer’s rendered height. From the screenshot, that top edge is at about **200 CSS px** from the top.

ANSWER: 200
