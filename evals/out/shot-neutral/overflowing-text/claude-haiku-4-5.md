# overflowing-text — opencode/claude-haiku-4-5

- arm: `shot`
- probes: content taller than a fixed height spills outside the box; it is not cut off
- expected: NO — four wrapped lines need 76.75px inside a 30px content box
- parsed answer: `YES`
- verdict: **FAIL (misread)**
- elapsed: 6416ms
- attached: `page.png`

## Question

Does all of `root>card`'s text fit inside `root>card`'s own 48px-tall border box?

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

Looking at the screenshot and the node tree information provided:

The `root>card` div contains the text "Payment failed because the card on file expired last month." The screenshot shows this text is rendered across 4 lines within the card's border box. The card has a height of 48px according to the question.

From the visual rendering in the screenshot, the text appears to fit within the vertical space of the card without overflowing. All four lines of text are visible and contained within the card's boundaries.

ANSWER: YES
