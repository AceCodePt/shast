# overflow-is-not-truncation — opencode/gpt-5.4-nano

- arm: `shot`
- probes: overflowing text is still painted, not cut off
- expected: YES — overflow is visible, so the spilled line is still drawn
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 11132ms
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

The evidence shows the rendered page (viewport `400x300`) with the full message text visible on screen, even though the last line is said to lie below the bottom edge of the `root>card` element’s box. In Chromium, text can still be painted outside an element’s border/box when the element does not clip overflow (the default is `overflow: visible`). Since the screenshot indicates that last line is readable within the viewport, a person could read it.

ANSWER: YES
