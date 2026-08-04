# padding-shrinks-content-box — opencode/gpt-5.4-nano

- arm: `shot`
- probes: padding reducing the content width, and the wrapping that follows
- expected: 4 — the 200px box keeps its width and the 24px padding shrinks the content box to 152px
- parsed answer: `4`
- verdict: **PASS**
- elapsed: 18282ms
- attached: `page.png`

## Question

How many lines does the text inside `root>card` wrap onto?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root       div
root>card  div  "one two three four five six seven eight nine ten"

Attached is a screenshot of the rendered page at 600x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

The text content inside `root>card` is `one two three four five six seven eight nine ten`. On the rendered screenshot, those words are broken into four separate visual lines: `one two three`, `four five six`, `seven eight`, and `nine ten`. Therefore the text wraps onto 4 lines.

ANSWER: 4
