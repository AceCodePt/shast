# stacked-overlays-still-readable — opencode/qwen3.5-plus

- arm: `shot`
- probes: coverage is not transitive: two coverers, and the text is still legible
- expected: YES — the transparent one hides nothing and the opaque one sits below the text line
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 12678ms
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

Looking at the rendered screenshot and node tree evidence:

The text "Still readable" in `root>line` is clearly visible at the top of the screenshot. While there are two other boxes (`root>glass` and `root>panel`) that paint on the page, the screenshot shows the text remains unobscured and legible in the top portion of the viewport. The dark bar appears below the text, not covering it.

ANSWER: YES
