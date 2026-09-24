# text-collision — opencode/gpt-5.4-nano

- arm: `shot`
- probes: two nodes drawing glyphs on the same pixels, with neither displaced nor covered
- expected: root>visible
- parsed answer: `root>visible`
- verdict: **PASS**
- elapsed: 9591ms
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

The authoritative rendered evidence shows two distinct text-bearing nodes: `root>ghost` with `"Important warning"` and `root>visible` with `"Everything is fine"`. In a “text collision” scenario, the question asks which other node’s glyphs overlap the same pixels as the `root>ghost` text. Since the only other text node present is `root>visible`, its text is the one that overlaps on-screen with `root>ghost`.

ANSWER: root>visible
