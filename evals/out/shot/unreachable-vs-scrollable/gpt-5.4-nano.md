# unreachable-vs-scrollable — opencode/gpt-5.4-nano

- arm: `shot`
- probes: telling a box you scroll to apart from a box scrolling cannot reach
- expected: root>sideways — it runs 400px past the right edge, and pages do not scroll horizontally
- parsed answer: `root>sideways`
- verdict: **PASS**
- elapsed: 7518ms
- attached: `page.png`

## Question

Both `root>lower` and `root>sideways` sit outside the area first shown. Only one of them can be brought into view by ordinary scrolling. Which node can the viewer NOT reach that way?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 500x300

root           div
root>lower     div  "further down"
root>sideways  div  "runs off sideways"

Attached is a screenshot of the rendered page at 500x300 CSS px, at 1 device pixel per CSS px.
```

## Model reply

The screenshot shows only `root>sideways` (“runs off sideways”) within the 500x300 viewport, while `root>lower` (“further down”) is not visible. Since `root>lower` is described as sitting lower (vertically), ordinary vertical scrolling should be able to move it into view. `root>sideways` is described as running off to the side (horizontally), so ordinary scrolling cannot bring it fully into the viewport.

ANSWER: root>sideways
