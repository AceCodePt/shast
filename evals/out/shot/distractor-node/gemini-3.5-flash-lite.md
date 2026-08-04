# distractor-node — opencode/gemini-3.5-flash-lite

- arm: `shot`
- probes: answering about the node asked for, not the flagged one next to it
- expected: YES — only `root>first` is covered
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 7290ms
- attached: `page.png`

## Question

Can a viewer read the text in `root>second`?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 500x300

root         div
root>first   p    "First paragraph here"
root>second  p    "Second paragraph here"
root>cover   div

Attached is a screenshot of the rendered page at 500x300 CSS px, at 1 device pixel per CSS px.
```

## Model reply

The text in `root>second` ("Second paragraph here") is clearly visible and legible near the top of the rendered screenshot. Therefore, a viewer can read it without obstruction.

ANSWER: YES
