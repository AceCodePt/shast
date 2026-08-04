# unreachable-vs-scrollable — opencode/claude-haiku-4-5

- arm: `shot`
- probes: telling a box you scroll to apart from a box scrolling cannot reach
- expected: root>sideways — it runs 400px past the right edge, and pages do not scroll horizontally
- parsed answer: `root>sideways`
- verdict: **PASS**
- elapsed: 8271ms
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

Looking at the screenshot and the node tree information:

The viewport is 500x300 CSS pixels. The screenshot shows "runs off sideways" text in the upper left, which corresponds to `root>sideways`. The text "further down" is not visible in the screenshot, indicating `root>lower` is positioned below the initial viewport.

Since `root>lower` is positioned further down (below the initial viewport), it can be brought into view by scrolling vertically. However, `root>sideways` runs off the side of the viewport, meaning it extends beyond the horizontal boundaries. While vertical scrolling can bring `root>lower` into view, horizontal scrolling would be needed to fully see `root>sideways`. The question asks which node cannot be reached by "ordinary scrolling" - typically referring to vertical scrolling on a webpage.

Given that `root>lower` is below the fold but within the scrollable area, it can be reached by vertical scrolling. The node `root>sideways` that "runs off sideways" extends beyond the horizontal viewport boundaries and cannot be fully brought into view through ordinary (vertical) scrolling alone.

ANSWER: root>sideways
