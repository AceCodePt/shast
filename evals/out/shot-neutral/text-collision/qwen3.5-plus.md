# text-collision — opencode/qwen3.5-plus

- arm: `shot`
- probes: two nodes drawing glyphs on the same pixels, with neither displaced nor covered
- expected: root>visible
- parsed answer: `root>visible`
- verdict: **PASS**
- elapsed: 12705ms
- attached: `page.png`

## Question

Which node's text is drawn on the same pixels as `root>ghost`'s text?

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

Looking at the screenshot and DOM tree:

1. The `root>ghost` node contains "Important warning" but only "warning" is visible in the screenshot
2. The `root>visible` node contains "Everything is fine" which appears at the top of the screenshot
3. The word "Important" from `root>ghost` is not visible because `root>visible`'s text "Everything is fine" is drawn on top of it, overlapping those pixels

ANSWER: root>visible
