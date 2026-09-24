# union-coverage — opencode/gpt-5.4-nano

- arm: `shot`
- probes: two coverers that hide half a line each; neither alone would hide it
- expected: NO — together the two cover the whole line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 11881ms
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

The node tree indicates that `root>line` contains the text `"Hidden by two"`, and the screenshot is treated as the authoritative rendering evidence. Since the question notes that neither covering box alone spans the whole line, the intended setup is that the two coverings work together to conceal the full line content. Therefore, a viewer would not be able to read the words in `root>line`.  

ANSWER: NO
