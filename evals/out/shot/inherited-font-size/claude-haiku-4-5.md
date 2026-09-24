# inherited-font-size — opencode/claude-haiku-4-5

- arm: `shot`
- probes: an effective text size that no line on the node declares
- expected: root>heading (30px inherited, against 22px declared)
- parsed answer: `root>heading`
- verdict: **PASS**
- elapsed: 5639ms
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

Looking at the screenshot and the node tree information provided:

The screenshot shows "Quarterly report" rendered larger than "Draft" below it. According to the node tree, "Quarterly report" corresponds to `root>heading` and "Draft" corresponds to `root>caption`.

The visual evidence clearly shows that `root>heading` is rendered with significantly larger text than `root>caption`. This makes sense given the semantic naming - the heading element is displayed prominently while the caption is shown in smaller text.

ANSWER: root>heading
