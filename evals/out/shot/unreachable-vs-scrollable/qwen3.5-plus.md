# unreachable-vs-scrollable — opencode/qwen3.5-plus

- arm: `shot`
- probes: telling a box you scroll to apart from a box scrolling cannot reach
- expected: root>sideways — it runs 400px past the right edge, and pages do not scroll horizontally
- parsed answer: `root>sideways`
- verdict: **PASS**
- elapsed: 12638ms
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

Looking at the node names and their text content:

- `root>lower` contains "further down" — this indicates **vertical** overflow, which ordinary (vertical) scrolling can reach
- `root>sideways` contains "runs off sideways" — this indicates **horizontal** overflow, which ordinary vertical scrolling cannot reach

The screenshot confirms "runs off sideways" is visible, meaning it extends horizontally beyond the viewport. Ordinary scrolling (vertical) cannot bring horizontally overflowed content fully into view.

ANSWER: root>sideways
