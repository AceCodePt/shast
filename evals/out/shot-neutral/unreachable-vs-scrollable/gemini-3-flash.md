# unreachable-vs-scrollable — opencode/gemini-3-flash

- arm: `shot`
- probes: telling a box you scroll to apart from a box scrolling cannot reach
- expected: root>sideways — it runs 400px past the right edge, and pages do not scroll horizontally
- parsed answer: `root>lower`
- verdict: **FAIL (answer-line slip or no reply)**
- elapsed: 151328ms
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

Based on the information provided, we can deduce the reachability of the nodes by analyzing the viewport constraints and the visual evidence in the screenshot.

1.  **Initial State**: The prompt states that both `root>lower` ("further down") and `root>sideways` ("runs off sideways") are initially outside the 500x300 viewport. This means neither is visible at the default scroll position (0,0).
2.  **Visual Evidence**: The provided screenshot of the 500x300 viewport shows the text "runs off sideways" clearly at the top-left. Since this node was originally "outside the area first shown," the fact that it is now visible means it was successfully brought into view (likely by scrolling horizontally).
3.  **Logical Deduction**: The prompt specifies that "Only one of them can be brought into view by ordinary scrolling." Since the screenshot proves that `root>sideways` has been successfully reached and brought into view, it must be the reachable node. Consequently, the other node, `root>lower`, must be the one that cannot be reached. This often occurs in web layouts where vertical scrolling is disabled or the content is positioned in an unreachable negative coordinate space relative to the allowed scroll axes.

Reasoning: Since `root>sideways` is visible in the provided rendered viewport, it has been reached. Given that only one node is reachable, the other must be unreachable.

ANSWER: root>lower
