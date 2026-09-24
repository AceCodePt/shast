# stacked-overlays-still-readable — opencode/qwen3.5-plus

- arm: `shot`
- probes: coverage is not transitive: two coverers, and the text is still legible
- expected: YES — the transparent one hides nothing and the opaque one sits below the text line
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 10484ms
- attached: `page.png`

## Question

Two boxes paint over `root>line`. Can a viewer still read its text?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 400x300

root        div
root>line   div  "Still readable"
root>glass  div
root>panel  div

Attached is a screenshot of the rendered page at 400x300 CSS px, at 1 device pixel per CSS px.
```

## Model reply

The screenshot shows the text "Still readable" clearly visible at the top of the rendered page. While two boxes (`root>glass` and `root>panel`) paint over the area, the text from `root>line` remains unobscured and legible. The visual evidence confirms the text can be read.

ANSWER: YES
