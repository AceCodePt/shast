# percent-height-indefinite — opencode/gemini-3-flash

- arm: `shot`
- probes: a percentage height whose containing block is indefinite
- expected: NO — `root>outer` has no declared height, so the percentage behaves as `auto` and `tall` is one line (~19px) against `filler`'s 60px
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 14653ms
- attached: `page.png`

## Question

`root>outer>tall` declares `height: 100%`. Is it taller than its sibling `root>outer>filler`?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root               div
root>outer         div
root>outer>filler  div  "a"
root>outer>tall    div  "b"

Attached is a screenshot of the rendered page at 600x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

The provided node tree and screenshot indicate that `root>outer>tall` is not taller than its sibling `root>outer>filler`. In CSS, a percentage height (like `height: 100%`) only resolves if the containing block has an explicit, definite height; otherwise, it resolves to `auto`. Since the parent `root>outer` has an indefinite height based on its content, the `100%` height on `tall` behaves as `auto`, making both divs approximately the same height (the height of a single line of text).

ANSWER: NO
