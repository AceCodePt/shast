# text-collision — opencode/claude-haiku-4-5

- arm: `shot`
- probes: two nodes drawing glyphs on the same pixels, with neither displaced nor covered
- expected: root>visible
- parsed answer: `root>visible`
- verdict: **PASS**
- elapsed: 6744ms
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

Looking at the screenshot and the node tree information:

The screenshot shows two text elements rendered on the page:
- "Important warning" (appears at the top)
- "Everything is fine" (appears below it)

According to the node tree:
- `root>ghost` contains "Important warning"
- `root>visible` contains "Everything is fine"

From the rendered screenshot, I can see that the text "Everything is fine" is visually positioned where "Important warning" would be, creating a text collision/overlap. The "Important warning" text from `root>ghost` and "Everything is fine" text from `root>visible` are drawn on the same pixels, with "Everything is fine" appearing to be the visible text on top.

ANSWER: root>visible
