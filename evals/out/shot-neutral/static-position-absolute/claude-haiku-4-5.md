# static-position-absolute — opencode/claude-haiku-4-5

- arm: `shot`
- probes: an absolutely positioned box with no offsets, which keeps its place
- expected: 50 — with all offsets `auto` the box stays at its static position, directly below the 50px spacer, rather than jumping to the top of the containing block
- parsed answer: `27`
- verdict: **FAIL (misread)**
- elapsed: 9939ms
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

Looking at the information provided:

1. The viewport is 600x400 CSS pixels
2. There are two div elements: `root>spacer` and `root>floaty`
3. `root>floaty` has `position: absolute` but declares no `top`, `right`, `bottom`, or `left` properties
4. From the screenshot, I can see "spacer" text at the top and "floaty" text below it

When an absolutely positioned element has no explicit positioning properties (`top`, `right`, `bottom`, `left`), it uses the default positioning behavior. According to CSS specifications, an absolutely positioned element without positioning properties will be positioned as if it were statically positioned - meaning it follows the normal document flow.

From the screenshot, the "floaty" text appears to start approximately where the "spacer" text ends. The "spacer" text appears to be at the very top of the page, and "floaty" appears to be positioned directly below it. Based on the visual rendering shown in the screenshot, the top edge of `root>floaty` appears to be at approximately y=27 CSS pixels (accounting for the line height of the "spacer" text above it).

ANSWER: 27
