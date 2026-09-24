# occluded-text — opencode/gpt-5.4-nano

- arm: `shot`
- probes: an opaque positioned box hides the text of an in-flow box under it
- expected: NO — the banner paints an opaque background over its lines
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 8128ms
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

The `root>lede` text is shown with a truncation marker: `"The quarterly results are in and every region beat its targ…"` and the evidence notes it is “72 chars.” Since the provided authoritative render evidence only includes a shortened version with an ellipsis (not the complete sentence), a reader of the page as rendered here would not be able to read the entire sentence from that visible content alone.

ANSWER: NO
