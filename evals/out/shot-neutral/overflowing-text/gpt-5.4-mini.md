# overflowing-text — opencode/gpt-5.4-mini

- arm: `shot`
- probes: content taller than a fixed height spills outside the box; it is not cut off
- expected: NO — four wrapped lines need 76.75px inside a 30px content box
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 10324ms
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

No. The screenshot shows the text wrapping into four lines, but the bordered card is only about 48px tall, so the lower lines spill below the box instead of fitting inside it.

ANSWER: NO
