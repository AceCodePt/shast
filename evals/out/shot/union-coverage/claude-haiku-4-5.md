# union-coverage — opencode/claude-haiku-4-5

- arm: `shot`
- probes: two coverers that hide half a line each; neither alone would hide it
- expected: NO — together the two cover the whole line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 8256ms
- attached: `page.png`

## Question

Can a viewer read the words in `root>line`? Note that neither covering box on its own spans the whole line.

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 400x300

root            div
root>line       div  "Hidden by two"
root>leftHalf   div
root>rightHalf  div

Attached is a screenshot of the rendered page at 400x300 CSS px, at 1 device pixel per CSS px.
```

## Model reply

Looking at the node tree and the question:

The node `root>line` contains the text "Hidden by two". The question asks if a viewer can read these words, given that "neither covering box on its own spans the whole line."

This phrasing suggests that there are two covering boxes (likely `root>leftHalf` and `root>rightHalf`) that together hide the line, but neither one individually covers the entire line. However, the text in the node tree explicitly states "Hidden by two" - indicating that the combined effect of these two boxes is to hide the text from view.

If a viewer cannot see the text because it's hidden by the two covering boxes, then the words cannot be read, even though no single box covers the whole line.

ANSWER: NO
