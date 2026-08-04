# static-position-absolute — opencode/gpt-5.4-nano

- arm: `shot`
- probes: an absolutely positioned box with no offsets, which keeps its place
- expected: 50 — with all offsets `auto` the box stays at its static position, directly below the 50px spacer, rather than jumping to the top of the containing block
- parsed answer: `26`
- verdict: **FAIL (misread)**
- elapsed: 20112ms
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

With `position: absolute` and no `top/right/bottom/left` specified, the browser uses the element’s *static position* (where it would have been laid out in normal document flow) to determine where it should render. Here, `floaty` would be a block after `spacer`, so its top edge aligns immediately after the rendered height of `spacer`. From the screenshot at 600×400, `spacer` starts at the default body offset (~8px) and occupies one line (~18px), so `floaty`’s top edge renders at `8 + 18 = 26` CSS pixels.

ANSWER: 26
