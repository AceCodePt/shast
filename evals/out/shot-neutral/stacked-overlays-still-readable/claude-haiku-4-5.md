# stacked-overlays-still-readable — opencode/claude-haiku-4-5

- arm: `shot`
- probes: coverage is not transitive: two coverers, and the text is still legible
- expected: YES — the transparent one hides nothing and the opaque one sits below the text line
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 7492ms
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

Based on the information provided:

The screenshot shows "Still readable" text at the top of the page, which corresponds to the `root>line` div element. Despite the presence of two boxes (`root>glass` and `root>panel`) that paint over this element, the text is clearly visible and legible in the rendered output. The text appears in dark color against a light background with sufficient contrast for reading.

The question asks whether a viewer can still read the text of `root>line` when two boxes paint over it, and the evidence from the screenshot directly confirms that the text remains readable.

ANSWER: YES
