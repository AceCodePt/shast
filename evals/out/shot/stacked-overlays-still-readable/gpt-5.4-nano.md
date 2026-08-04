# stacked-overlays-still-readable — opencode/gpt-5.4-nano

- arm: `shot`
- probes: coverage is not transitive: two coverers, and the text is still legible
- expected: YES — the transparent one hides nothing and the opaque one sits below the text line
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 7420ms
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

The authoritative node tree evidence from Chromium shows that `root>line` contains the text `"Still readable"` (`root>line   div  "Still readable"`). Even though two other boxes (`root>glass` and `root>panel`) paint over it, the provided screenshot context indicates the viewer can still perceive that text. Therefore, the text is still readable.  

ANSWER: YES
