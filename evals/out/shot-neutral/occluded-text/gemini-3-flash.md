# occluded-text — opencode/gemini-3-flash

- arm: `shot`
- probes: an opaque positioned box hides the text of an in-flow box under it
- expected: NO — the banner paints an opaque background over its lines
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 15981ms
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

Based on the provided information, the sentence in `root>lede` ("The quarterly results are in...") is not visible in the rendered screenshot. The screenshot shows a dark banner (`root>banner`) at the top of the viewport that appears to occlude the area where the lede paragraph would typically be rendered, as only the subsequent `root>body` text ("Details follow in the table below.") is visible below it. Because the text is covered by the banner, a person reading the page cannot see or read the sentence.

ANSWER: NO
