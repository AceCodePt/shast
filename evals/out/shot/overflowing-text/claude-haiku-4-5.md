# overflowing-text — opencode/claude-haiku-4-5

- arm: `shot`
- probes: content taller than a fixed height spills outside the box; it is not cut off
- expected: NO — four wrapped lines need 76.75px inside a 30px content box
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 8540ms
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

Looking at the screenshot, I can see the text "Payment failed because the card on file expired last month." is displayed in the `root>card` div element.

The text spans 4 lines in the rendered output:
- "Payment failed"
- "because the card"
- "on file expired"
- "last month."

The `root>card` element has a 48px-tall border box. With typical line height for text (usually around 1.2-1.5x font size), 4 lines of text would require approximately 48-60px of vertical space depending on font size. Looking at the screenshot, the text appears to fill most or all of the available height, and there is minimal whitespace below the last line.

Given that the text spans 4 lines and the container is only 48px tall, it appears the text is either tightly constrained or may be overflowing the bottom of the border box.

ANSWER: NO
