# transparent-overlay — opencode/qwen3.5-plus

- arm: `shot`
- probes: the same geometry with a transparent coverer must NOT read as hidden
- expected: YES — the banner has no background, so the text shows through
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 13893ms
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

1. The node tree shows `root>lede` contains a `<p>` element with 72 characters of text
2. The screenshot shows this text rendered as: "The quarterly results are in and every region beat its target this time." - the full sentence is visible, wrapped across two lines
3. The text fits within the 600x400 viewport with no overflow or clipping

The entire sentence is displayed on screen and readable.

ANSWER: YES
