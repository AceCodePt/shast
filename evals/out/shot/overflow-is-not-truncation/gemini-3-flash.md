# overflow-is-not-truncation — opencode/gemini-3-flash

- arm: `shot`
- probes: overflowing text is still painted, not cut off
- expected: YES — overflow is visible, so the spilled line is still drawn
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 11856ms
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

The screenshot shows that while the text "on file expired last month." overflows the bottom border of the `root>card` element, it remains visible against the white background of the viewport. In standard web rendering, content that overflows a container is still painted on the page unless the `overflow` property is specifically set to a clipping value like `hidden`. Since the text is clearly visible in the provided image, it is painted on the page and can be read.

ANSWER: YES
