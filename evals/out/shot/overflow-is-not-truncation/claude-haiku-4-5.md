# overflow-is-not-truncation — opencode/claude-haiku-4-5

- arm: `shot`
- probes: overflowing text is still painted, not cut off
- expected: YES — overflow is visible, so the spilled line is still drawn
- parsed answer: `YES`
- verdict: **PASS**
- elapsed: 9162ms
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

Looking at the screenshot and the provided information:

The screenshot shows the text "Payment failed because the card on file expired last month." displayed in a box. The text wraps across multiple lines, and the final line "last month." appears to be positioned at or near the bottom edge of the visible card container.

According to the question, the last line sits below the bottom edge of `root>card`. The screenshot clearly shows that the text "last month." is visible and readable within the rendered page. Even though it may be at the bottom boundary, it is painted on the page and a person could read it.

The key distinction here is between text that overflows beyond the visible boundary (which would not be readable if clipped) versus text that is still rendered on screen. The screenshot evidence shows the text is actually visible on the page.

ANSWER: YES
