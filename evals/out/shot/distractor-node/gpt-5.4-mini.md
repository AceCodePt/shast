# distractor-node — opencode/gpt-5.4-mini

- arm: `shot`
- probes: answering about the node asked for, not the flagged one next to it
- expected: YES — only `root>first` is covered
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 7958ms
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

Yes. The screenshot shows `Second paragraph here` clearly rendered at the top left, so a viewer can read `root>second`. The other nodes do not obscure it in the visible output.

ANSWER: YES
