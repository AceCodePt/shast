# unreachable-vs-scrollable — opencode/qwen3.5-plus

- arm: `shot`
- probes: telling a box you scroll to apart from a box scrolling cannot reach
- expected: root>sideways — it runs 400px past the right edge, and pages do not scroll horizontally
- parsed answer: `root>sideways`
- verdict: **PASS**
- elapsed: 15102ms
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

Looking at the evidence:

1. The viewport is 500x300 pixels
2. `root>lower` contains "further down" - this suggests vertical overflow, which ordinary vertical scrolling can reach
3. `root>sideways` contains "runs off sideways" - this indicates horizontal overflow beyond the viewport width

Ordinary scrolling on web pages is vertical (up/down). Content that extends horizontally sideways cannot be brought into view with standard vertical scrolling - it would require horizontal scrolling, which is not considered "ordinary scrolling" and may not even be enabled if the content uses `overflow: hidden` or similar.

The screenshot confirms "runs off sideways" is visible but extends beyond the frame horizontally.

ANSWER: root>sideways
