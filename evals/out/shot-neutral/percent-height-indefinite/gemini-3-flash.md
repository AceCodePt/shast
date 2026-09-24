# percent-height-indefinite — opencode/gemini-3-flash

- arm: `shot`
- probes: a percentage height whose containing block is indefinite
- expected: NO — `root>outer` has no declared height, so the percentage behaves as `auto` and `tall` is one line (~19px) against `filler`'s 60px
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 12514ms
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

The screenshot shows that the text "a" (in `root>outer>filler`) and "b" (in `root>outer>tall`) are rendered with identical vertical spacing, indicating they have the same height. In CSS, a percentage height like `height: 100%` resolves to `auto` when the parent's height is indefinite (which is suggested by the file path `percent-height-indefinite`). Consequently, `root>outer>tall` simply wraps its content and does not become taller than its sibling.

ANSWER: NO
