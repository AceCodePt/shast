# zero-size — opencode/gpt-5.4-nano

- arm: `shot`
- probes: a node that renders at no size while carrying content
- expected: YES — a 0x0 box does not clip; the text overflows it and is painted
- parsed answer: `NO`
- verdict: **FAIL (misread)**
- elapsed: 8851ms
- attached: `page.png`

## Question

`root>ghost` renders at 0x0. Are the words "Important warning" nevertheless painted somewhere on the page?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 400x300

root          div
root>ghost    div  "Important warning"
root>visible  div  "Everything is fine"

Attached is a screenshot of the rendered page at 400x300 CSS px, at 1 device pixel per CSS px.
```

## Model reply

The node tree shows a `root>ghost` div containing the text `"Important warning"`, so the text exists in the DOM. However, the question states that `root>ghost` renders at `0x0`, and Chromium would not paint the contents of an element that has no rendered area. Since the evidence is meant to be authoritative for what is actually on screen, we should treat that text as not being painted anywhere visible.

ANSWER: NO
