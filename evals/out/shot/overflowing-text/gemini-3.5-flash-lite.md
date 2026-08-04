# overflowing-text — opencode/gemini-3.5-flash-lite

- arm: `shot`
- probes: content taller than a fixed height spills outside the box; it is not cut off
- expected: NO — four wrapped lines need 76.75px inside a 30px content box
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 9883ms
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

The screenshot and node tree show that `root>card`'s 48px-tall box only contains the first two lines of text ("Payment failed because the card"). The remaining text ("on file expired last month.") overflows and renders completely outside the bottom border of the box. Therefore, not all of the text fits inside the box.

ANSWER: NO
