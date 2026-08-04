# text-collision — opencode/claude-haiku-4-5

- arm: `shot`
- probes: two nodes drawing glyphs on the same pixels, with neither displaced nor covered
- expected: root>visible
- parsed answer: `root>visible`
- verdict: **PASS**
- elapsed: 6896ms
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

Looking at the evidence provided:

The node tree shows:
- `root>ghost` contains the text "Important warning"
- `root>visible` contains the text "Everything is fine"

The screenshot shows the rendered page displays:
- "Everything is fine" at the top
- "warning" below it

The text "Important warning" from `root>ghost` is not visually shown in the screenshot, but based on the question asking which node's text is drawn on the same pixels, and given that "warning" appears in the visible output while "Important" does not, this suggests that the word "warning" (part of `root>ghost`'s text "Important warning") is being rendered on top of or overlapping with text from another node.

Since "Everything is fine" is the only other text node visible, and we can see "warning" displayed below "Everything is fine", the text collision is occurring between `root>ghost` and `root>visible`. The word "warning" from `root>ghost` is drawn on the same pixels where `root>visible`'s text would be rendered.

ANSWER: root>visible
