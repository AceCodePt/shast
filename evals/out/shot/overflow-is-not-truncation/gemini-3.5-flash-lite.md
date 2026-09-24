# overflow-is-not-truncation — opencode/gemini-3.5-flash-lite

- arm: `shot`
- probes: overflowing text is still painted, not cut off
- expected: YES — overflow is visible, so the spilled line is still drawn
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 8961ms
- attached: `page.png`

## Question

The last line of `root>card`'s text sits below the bottom edge of `root>card`. Is that last line still painted on the page, where a person could read it?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 400x300

root       div
root>card  div  "Payment failed because the card on file expired last month."

Attached is a screenshot of the rendered page at 400x300 CSS px, at 1 device pixel per CSS px.
```

## Model reply

Based on the provided screenshot and node tree, the text extending past the bottom edge of the `root>card` box ("on file expired last month.") is rendered directly onto the page canvas below the element's border. Because there is no clipping or overflow hidden rule applied, the text remains fully visible and readable by anyone viewing the page.

ANSWER: YES
