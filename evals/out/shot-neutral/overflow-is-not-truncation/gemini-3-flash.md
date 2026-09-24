# overflow-is-not-truncation — opencode/gemini-3-flash

- arm: `shot`
- probes: overflowing text is still painted, not cut off
- expected: YES — overflow is visible, so the spilled line is still drawn
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 10966ms
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

The screenshot shows that the text "on file expired" and "last month." is rendered clearly on the page below the black border of the `root>card` element. In CSS, the default value for the `overflow` property is `visible`, which allows content to extend beyond the boundaries of its container without being clipped or hidden. Since the last line is plainly visible in the actual rendering provided, it is still painted on the page.

ANSWER: YES
