# occluded-text — opencode/qwen3.5-plus

- arm: `shot`
- probes: an opaque positioned box hides the text of an in-flow box under it
- expected: NO — the banner paints an opaque background over its lines
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 17554ms
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

Looking at the screenshot, I can see that the page has a dark banner at the top, and only the text "Details follow in the table below." (which is `root>body`) is visible. The `root>lede` paragraph containing "The quarterly results are in and every region beat its targ…" (72 chars) is not visible in the rendered page - it appears to be occluded by the banner element or otherwise hidden from view.

Since the lede text cannot be seen in the rendered screenshot, a person reading this page in a browser cannot read the whole sentence.

ANSWER: NO
