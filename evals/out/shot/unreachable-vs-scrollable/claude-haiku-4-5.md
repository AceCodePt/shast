# unreachable-vs-scrollable — opencode/claude-haiku-4-5

- arm: `shot`
- probes: telling a box you scroll to apart from a box scrolling cannot reach
- expected: root>sideways — it runs 400px past the right edge, and pages do not scroll horizontally
- parsed answer: `root>sideways`
- verdict: **PASS**
- elapsed: 11255ms
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

Looking at the image and the node tree information:

The screenshot shows a 500x300 viewport with text "runs off sideways" visible at the top. This text corresponds to `root>sideways`, which means it's positioned horizontally outside the initial viewport but can be scrolled into view horizontally.

The node `root>lower` is described as "further down" in the source, indicating it's positioned below the initial viewport. This can be brought into view through vertical scrolling.

However, `root>sideways` "runs off sideways" - it extends beyond the right edge of the viewport. While the text is partially visible in the screenshot, content that "runs off sideways" suggests it extends horizontally beyond the viewport width and cannot be fully brought into view by vertical scrolling. The question asks which node cannot be reached by "ordinary scrolling" - if `root>sideways` extends beyond the viewport horizontally and there's no horizontal scrolling capability (which is common for ordinary web pages), then it cannot be fully brought into view.

Given the phrasing "runs off sideways" and that `root>lower` can be accessed by vertical scrolling, the node that cannot be reached by ordinary scrolling is the one that runs horizontally off the page.

ANSWER: root>sideways
