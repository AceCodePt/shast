# union-coverage — opencode/gpt-5.4-nano

- arm: `shot`
- probes: two coverers that hide half a line each; neither alone would hide it
- expected: NO — together the two cover the whole line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 8158ms
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

The node tree indicates that the text node at `root>line` is present and has the content `"Hidden by two"`, meaning the source text exists. However, the evidence is explicitly labeled as authoritative for what is actually on screen, and it describes the line as being hidden by two covering elements. Since the two covering boxes together prevent the line from being visible (and neither covers it alone doesn’t matter if the combination still obscures all of it), a viewer cannot read the words in `root>line`.

ANSWER: NO
