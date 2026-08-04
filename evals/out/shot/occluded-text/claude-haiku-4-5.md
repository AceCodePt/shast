# occluded-text — opencode/claude-haiku-4-5

- arm: `shot`
- probes: an opaque positioned box hides the text of an in-flow box under it
- expected: NO — the banner paints an opaque background over its lines
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 9024ms
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

Looking at the information provided:

The node tree shows that `root>lede` contains a `p` element with text: "The quarterly results are in and every region beat its targ…" (72 chars)

The ellipsis ("…") at the end indicates the text is truncated in the source representation. The screenshot shows a dark overlay at the top of the page that appears to be occluding (covering) text. The visible text in the screenshot reads "details follow in the table below." which corresponds to the `root>body` element, while the `root>lede` text above it is hidden behind the dark overlay.

Since the lede text is occluded by the dark overlay at the top of the page, a person reading this page in a browser would not be able to read the whole sentence in `root>lede`.

ANSWER: NO
