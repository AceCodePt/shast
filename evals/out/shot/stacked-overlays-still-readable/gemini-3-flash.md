# stacked-overlays-still-readable — opencode/gemini-3-flash

- arm: `shot`
- probes: coverage is not transitive: two coverers, and the text is still legible
- expected: YES — the transparent one hides nothing and the opaque one sits below the text line
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 11297ms
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

The screenshot shows the text "Still readable" clearly visible at the top left of the viewport. Although the node tree contains two elements (`glass` and `panel`) that follow the text node and could potentially overlap it, the rendered image confirms that these elements do not obstruct the text. The only visible box is a dark horizontal bar positioned below the text, leaving the characters fully legible against the white background.

ANSWER: YES
