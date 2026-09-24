# padding-shrinks-content-box — opencode/claude-haiku-4-5

- arm: `shot`
- probes: padding reducing the content width, and the wrapping that follows
- expected: 4 — the 200px box keeps its width and the 24px padding shrinks the content box to 152px
- parsed answer: `4`
- verdict: **PASS**
- elapsed: 14026ms
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

Looking at the screenshot provided, I can count the text lines as they appear on the rendered page:

1. "one two three"
2. "four five six"
3. "seven eight"
4. "nine ten"

The text wraps across 4 distinct lines in the rendered output. This is visible in the screenshot where the content inside the `root>card` div breaks into these four separate lines due to the 600px width constraint.

ANSWER: 4
