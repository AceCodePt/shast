# provenance — opencode/gemini-3.5-flash-lite

- arm: `shot`
- probes: naming the node that declared a property, not the node that has it
- expected: root
- parsed answer: `root`
- verdict: **PASS**
- elapsed: 14772ms
- attached: `page.png`

## Question

Which node's css block declares the `border-radius` that `root>body>panel` renders with?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x300

root             div
root>body        div
root>body>panel  section  "Panel"

Attached is a screenshot of the rendered page at 600x300 CSS px, at 1 device pixel per CSS px.
```

## Model reply

The `border-radius` property applied to `root>body>panel` is declared in the root node's CSS block under `> body > panel`. The intermediate node `root>body` and the target node `root>body>panel` do not contain a `border-radius` declaration. Therefore, the declaration originates from the root node.

ANSWER: root
