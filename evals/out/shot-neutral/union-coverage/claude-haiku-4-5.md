# union-coverage — opencode/claude-haiku-4-5

- arm: `shot`
- probes: two coverers that hide half a line each; neither alone would hide it
- expected: NO — together the two cover the whole line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 6429ms
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

Looking at the information provided:

The node tree shows that `root>line` contains the text "Hidden by two". The question notes that "neither covering box on its own spans the whole line" - this indicates there are two covering boxes (presumably `root>leftHalf` and `root>rightHalf`) that together obscure the line.

The key phrase is "Hidden by two" - this explicitly states that the text in `root>line` is hidden. Even though neither covering box spans the whole line individually, together they completely cover the text, making it impossible for a viewer to read the words.

ANSWER: NO
