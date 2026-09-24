# occluded-text — opencode/claude-haiku-4-5

- arm: `shot`
- probes: an opaque positioned box hides the text of an in-flow box under it
- expected: NO — the banner paints an opaque background over its lines
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 11537ms
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

Based on the information provided:

The node tree shows that `root>lede` contains a `p` element with text: "The quarterly results are in and every region beat its targ…" (72 chars total)

The text is truncated in the source information with "…", indicating it's been cut off at 72 characters. The screenshot shows a viewport of 600x400 CSS pixels with dark text at the top that reads "Details follow in the table below." - this appears to be from the `root>body` element, not the `root>lede` element.

The visible text in the screenshot does not show the complete `root>lede` sentence. Given that the source information itself truncates the text with "…" and the screenshot shows the page rendered at 600x400 pixels, it appears the full sentence is not visible or readable in its entirety on this rendered page.

ANSWER: NO
