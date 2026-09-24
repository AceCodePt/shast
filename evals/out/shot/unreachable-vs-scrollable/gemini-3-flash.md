# unreachable-vs-scrollable — opencode/gemini-3-flash

- arm: `shot`
- probes: telling a box you scroll to apart from a box scrolling cannot reach
- expected: root>sideways — it runs 400px past the right edge, and pages do not scroll horizontally
- parsed answer: `root>lower`
- verdict: **FAIL (answer-line slip or no reply)**
- elapsed: 125756ms
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

Both the `root>lower` and `root>sideways` nodes are initially positioned outside the 500x300 viewport. The provided screenshot, which shows the rendered page at that same 500x300 size, clearly displays the text "runs off sideways," which belongs to the node `root>sideways`. This indicates that `root>sideways` was successfully brought into view (likely by scrolling down, given its appearance in the capture). Since the prompt states that only one of the two nodes can be reached by ordinary scrolling, and we have evidence that `root>sideways` was reached, it follows that `root>lower` is the node that cannot be brought into view. This is common in CSS test cases where a node (like `root>lower`) is placed at an unreachable coordinate (such as a negative x or y value) despite its descriptive name.

ANSWER: root>lower
