# inherited-font-size — opencode/qwen3.5-plus

- arm: `shot`
- probes: an effective text size that no line on the node declares
- expected: root>heading (30px inherited, against 22px declared)
- parsed answer: `root>heading`
- verdict: **PASS**
- elapsed: 10479ms
- attached: `page.png`

## Question

Which renders with larger text, `root>heading` or `root>caption`?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 500x300

root          div
root>heading  div  "Quarterly report"
root>caption  div  "Draft"

Attached is a screenshot of the rendered page at 500x300 CSS px, at 1 device pixel per CSS px.
```

## Model reply

Looking at the screenshot, "Quarterly report" (the `root>heading` node) is visibly rendered in a larger, bolder font compared to "Draft" (the `root>caption` node), which appears smaller and lighter.

ANSWER: root>heading
