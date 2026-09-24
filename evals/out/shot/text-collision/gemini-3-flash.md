# text-collision — opencode/gemini-3-flash

- arm: `shot`
- probes: two nodes drawing glyphs on the same pixels, with neither displaced nor covered
- expected: root>visible
- parsed answer: `root>visible`
- verdict: **PASS**
- elapsed: 11247ms
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

The screenshot shows two lines of text with significant overlap on the first line. The text "Everything is fine" from `root>visible` is rendered on the same line as the word "Important" from `root>ghost`'s text ("Important warning"), resulting in a jumbled appearance where the glyphs occupy the same pixels.

ANSWER: root>visible
