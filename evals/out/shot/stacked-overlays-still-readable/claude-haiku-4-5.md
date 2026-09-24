# stacked-overlays-still-readable — opencode/claude-haiku-4-5

- arm: `shot`
- probes: coverage is not transitive: two coverers, and the text is still legible
- expected: YES — the transparent one hides nothing and the opaque one sits below the text line
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 5723ms
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

Looking at the information provided:

1. The node tree shows `root>line` contains the text "Still readable"
2. There are two boxes that paint over it: `root>glass` and `root>panel`
3. The screenshot shows the text "Still readable" is visible at the top of the rendered page, above a dark gray box
4. The text is clearly legible in the rendered output

The screenshot directly demonstrates that despite two boxes painting over the `root>line` element, the text "Still readable" remains readable to a viewer. The rendering confirms that the text is not obscured by the overlaying elements.

ANSWER: YES
