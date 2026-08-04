# union-coverage — opencode/qwen3.5-plus

- arm: `shot`
- probes: two coverers that hide half a line each; neither alone would hide it
- expected: NO — together the two cover the whole line
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 15819ms
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

The node tree shows text "Hidden by two" in `root>line`, with two additional divs (`leftHalf` and `rightHalf`) that act as covering elements. The key insight is that while neither covering box individually spans the entire line, **together** they can still fully obscure the text by each covering a portion of it. The screenshot confirms this — it shows mostly blank space where the text would be, with dark elements at the top. The text content itself ("Hidden by two") is also a strong hint about what's happening.

ANSWER: NO
