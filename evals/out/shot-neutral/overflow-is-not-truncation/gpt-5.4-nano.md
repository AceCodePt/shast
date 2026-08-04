# overflow-is-not-truncation — opencode/gpt-5.4-nano

- arm: `shot`
- probes: overflowing text is still painted, not cut off
- expected: YES — overflow is visible, so the spilled line is still drawn
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 9287ms
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

The evidence says Chromium actually rendered the full text string inside `root>card`, and the attached screenshot shows the lines of the message (including the final “last month.”) visible within the 400x300 viewport. Since the screenshot is authoritative for what is painted on screen, the last line is still being rendered in a readable location even if it would be positioned below the card’s bottom edge.  

ANSWER: YES
