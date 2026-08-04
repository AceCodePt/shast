# static-position-absolute — opencode/claude-haiku-4-5

- arm: `shot`
- probes: an absolutely positioned box with no offsets, which keeps its place
- expected: 50 — with all offsets `auto` the box stays at its static position, directly below the 50px spacer, rather than jumping to the top of the containing block
- parsed answer: `59`
- verdict: **FAIL (misread)**
- elapsed: 15625ms
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

Looking at the rendered page information provided:

The node tree shows:
- `root` (a div)
- `root>spacer` (a div with text "spacer")
- `root>floaty` (a div with text "floaty")

From the screenshot, I can see "spacer" appears near the top of the viewport, and "floaty" appears below it.

When an element is `position: absolute` and doesn't declare `top`, `right`, `bottom`, or `left` properties, it uses the default positioning. In this case, the element is taken out of the normal flow but positioned at its "natural" location as if it were still in the flow. Since there's a preceding `spacer` div above it, the `floaty` element's top edge renders below the spacer text.

From the screenshot, the "floaty" text appears to start at approximately y=59 (after the "spacer" text which occupies roughly the first 59 pixels).

ANSWER: 59
