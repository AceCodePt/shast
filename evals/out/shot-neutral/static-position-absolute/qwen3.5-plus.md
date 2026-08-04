# static-position-absolute — opencode/qwen3.5-plus

- arm: `shot`
- probes: an absolutely positioned box with no offsets, which keeps its place
- expected: 50 — with all offsets `auto` the box stays at its static position, directly below the 50px spacer, rather than jumping to the top of the containing block
- parsed answer: `20`
- verdict: **FAIL (misread)**
- elapsed: 20615ms
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

Looking at the screenshot and the information provided:

The `floaty` element is `position: absolute` with no `top`, `right`, `bottom`, or `left` properties specified. When an absolutely positioned element has none of these offset properties, it renders at its **static position** — the position where it would have appeared in normal document flow.

From the screenshot, we can see:
- "spacer" renders at the top (y=0)
- "floaty" renders below it

Since `floaty` comes after `spacer` in the DOM and there are no margins/padding mentioned, the `floaty` element's top edge renders at the y-position corresponding to where it would sit in normal flow — which is immediately after the "spacer" div's content.

Looking at the screenshot, "floaty" appears to start at approximately y=20px (accounting for the default line-height of the "spacer" text, which is typically around 16-20px for default browser font settings).

ANSWER: 20
