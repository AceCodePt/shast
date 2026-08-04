# zero-size — opencode/gemini-3.5-flash-lite

- arm: `shot`
- probes: a node that renders at no size while carrying content
- expected: YES — a 0x0 box does not clip; the text overflows it and is painted
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 9508ms
- attached: `page.png`

## Question

`root>ghost` renders at 0x0. Are the words "Important warning" nevertheless painted somewhere on the page?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 400x300

root          div
root>ghost    div  "Important warning"
root>visible  div  "Everything is fine"

Attached is a screenshot of the rendered page at 400x300 CSS px, at 1 device pixel per CSS px.
```

## Model reply

Based on the screenshot and the provided node tree, the text from `root>ghost` ("Important warning") is visibly rendered on the page, with "warning" appearing on the second line below "Everything is fine". Therefore, despite having a 0x0 bounding box, the words are indeed painted on the page.

ANSWER: YES
