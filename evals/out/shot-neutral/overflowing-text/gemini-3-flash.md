# overflowing-text — opencode/gemini-3-flash

- arm: `shot`
- probes: content taller than a fixed height spills outside the box; it is not cut off
- expected: NO — four wrapped lines need 76.75px inside a 30px content box
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 10823ms
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

The screenshot shows a black border box containing the text "Payment failed because the card on file expired last month." While the first two lines of text are within the box, the remaining lines ("on file expired" and "last month.") clearly overflow past the bottom border. Since a significant portion of the text is rendered outside the boundary of the box, it does not fit within the specified 48px-tall border box.

ANSWER: NO
