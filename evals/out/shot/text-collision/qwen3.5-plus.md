# text-collision — opencode/qwen3.5-plus

- arm: `shot`
- probes: two nodes drawing glyphs on the same pixels, with neither displaced nor covered
- expected: root>visible
- parsed answer: `root>visible`
- verdict: **PASS**
- elapsed: 14390ms
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

Looking at the rendered screenshot and the node tree:

- `root>ghost` contains "Important warning" but only "warning" is visible in the screenshot
- `root>visible` contains "Everything is fine" which appears at the top of the rendered image

The fact that "Important " from the ghost node is not visible while "Everything is fine" appears in that space indicates that `root>visible`'s text is drawn on top of (overlapping) the "Important " portion of `root>ghost`'s text.

ANSWER: root>visible
