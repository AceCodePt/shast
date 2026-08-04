# static-position-absolute — opencode/qwen3.5-plus

- arm: `shot`
- probes: an absolutely positioned box with no offsets, which keeps its place
- expected: 50 — with all offsets `auto` the box stays at its static position, directly below the 50px spacer, rather than jumping to the top of the containing block
- parsed answer: `16`
- verdict: **FAIL (misread)**
- elapsed: 19831ms
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

Looking at the screenshot, I can see two elements rendered:
1. "spacer" at the top of the viewport
2. "floaty" positioned directly below it

When an element has `position: absolute` but no `top`, `right`, `bottom`, or `left` properties specified, those properties default to `auto`. This means the element renders at its **static position** - exactly where it would have been in the normal document flow.

From the image, "spacer" appears first (at y=0), and "floaty" appears below it. With default browser styling (16px font-size, ~1.2 line-height), the "spacer" div would occupy approximately 16-20px of vertical space. The "floaty" element's top edge renders immediately after "spacer".

Looking at the spacing in the screenshot, "floaty" appears to start at approximately y=16 CSS pixels (one line of text below the top edge).

ANSWER: 16
