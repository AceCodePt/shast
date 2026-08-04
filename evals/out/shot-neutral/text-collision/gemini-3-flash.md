# text-collision — opencode/gemini-3-flash

- arm: `shot`
- probes: two nodes drawing glyphs on the same pixels, with neither displaced nor covered
- expected: root>visible
- parsed answer: `root>visible`
- verdict: **PASS**
- elapsed: 11179ms
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

The screenshot shows that the text "Important" (part of the content for `root>ghost`) is rendered at the same coordinates as the text "Everything" from `root>visible`, creating a visible collision of glyphs in the top-left corner. Although the word "warning" appears on a subsequent line, the initial portion of `root>ghost`'s text is drawn on the same pixels as the text in `root>visible`.

ANSWER: root>visible
