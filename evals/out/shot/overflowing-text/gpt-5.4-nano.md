# overflowing-text — opencode/gpt-5.4-nano

- arm: `shot`
- probes: content taller than a fixed height spills outside the box; it is not cut off
- expected: NO — four wrapped lines need 76.75px inside a 30px content box
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 11632ms
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

`root>card` contains the text `"Payment failed because the card on file expired last month."`, which (as seen in the rendered screenshot) wraps into multiple lines: “Payment failed”, “because the card”, “on file expired”, “last month.”. With a 48px-tall border box, fitting would require that the total rendered line height across these lines stays within 48px, but the text clearly occupies more than three typical 16px lines, indicating it cannot fit vertically in 48px.

ANSWER: NO
