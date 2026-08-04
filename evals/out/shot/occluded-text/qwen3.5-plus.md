# occluded-text — opencode/qwen3.5-plus

- arm: `shot`
- probes: an opaque positioned box hides the text of an in-flow box under it
- expected: NO — the banner paints an opaque background over its lines
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 14061ms
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

**Reasoning:**

The screenshot shows that the `root>lede` paragraph is not visible on the rendered page. The dark banner at the top is obscuring the lede text, and only the `root>body` paragraph ("Details follow in the table below.") is visible below it. Additionally, the source text itself shows truncation ("targ…") indicating CSS is cutting off the text. Since the lede content is hidden behind the banner, a person cannot read it.

ANSWER: NO
