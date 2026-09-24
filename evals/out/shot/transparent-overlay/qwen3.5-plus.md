# transparent-overlay — opencode/qwen3.5-plus

- arm: `shot`
- probes: the same geometry with a transparent coverer must NOT read as hidden
- expected: YES — the banner has no background, so the text shows through
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 17050ms
- attached: `page.png`

## Question

Can a person reading this page in a browser read the whole sentence in `root>lede`?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root         div
root>lede    p    "The quarterly results are in and every region beat its targ…" (72 chars)
root>body    p    "Details follow in the table below."
root>banner  div

Attached is a screenshot of the rendered page at 600x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

Looking at the evidence:

1. The viewport is 600x400 CSS pixels
2. The screenshot shows the rendered page with the text "The quarterly results are in and every region beat its target this time." fully visible, wrapping across two lines
3. The `root>lede` element contains this complete sentence, and the screenshot confirms it's all displayed on screen (not truncated with an ellipsis visually)

The text wraps to a second line but remains fully readable within the viewport.

ANSWER: YES
