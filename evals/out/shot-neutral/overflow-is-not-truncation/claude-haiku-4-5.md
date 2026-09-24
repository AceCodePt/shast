# overflow-is-not-truncation — opencode/claude-haiku-4-5

- arm: `shot`
- probes: overflowing text is still painted, not cut off
- expected: YES — overflow is visible, so the spilled line is still drawn
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 8754ms
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

Looking at the information provided:

The node tree shows that `root>card` is a div containing the text "Payment failed because the card on file expired last month."

The screenshot shows this text rendered in the viewport (400x300). The text appears to be displayed across multiple lines, with the last line ("last month.") positioned near the bottom of the visible area.

The question asks whether the last line is "still painted on the page, where a person could read it." According to the screenshot attachment, the text is visible and readable within the rendered page - the last line is clearly visible in the image provided.

Even though the question states the last line "sits below the bottom edge of `root>card`," the screenshot evidence shows the text is actually rendered and visible in the viewport. If it weren't painted/rendered, it wouldn't appear in the screenshot.

ANSWER: YES
