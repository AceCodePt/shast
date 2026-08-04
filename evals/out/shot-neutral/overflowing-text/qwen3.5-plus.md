# overflowing-text — opencode/qwen3.5-plus

- arm: `shot`
- probes: content taller than a fixed height spills outside the box; it is not cut off
- expected: NO — four wrapped lines need 76.75px inside a 30px content box
- parsed answer: `YES`
- verdict: **FAIL (misread)**
- elapsed: 14640ms
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

Looking at the screenshot, I can see the text "Payment failed because the card on file expired last month." is displayed across 4 lines within a bordered box. All the text is fully visible and contained within the border - nothing is cut off or overflowing.

ANSWER: YES
