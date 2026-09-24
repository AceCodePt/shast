# union-coverage — opencode/gemini-3-flash

- arm: `shot`
- probes: two coverers that hide half a line each; neither alone would hide it
- expected: NO — together the two cover the whole line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 11825ms
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

The screenshot shows two dark rectangular boxes at the top of the viewport that appear to correspond to `leftHalf` and `rightHalf`. While neither box spans the entire width on its own, their combined area completely covers the location where the text "Hidden by two" from `root>line` would be rendered. Since no text is visible in the provided image, a viewer cannot read it.

ANSWER: NO
