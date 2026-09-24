# percent-height-indefinite — opencode/gemini-3.5-flash-lite

- arm: `shot`
- probes: a percentage height whose containing block is indefinite
- expected: NO — `root>outer` has no declared height, so the percentage behaves as `auto` and `tall` is one line (~19px) against `filler`'s 60px
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 9637ms
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

In CSS, percentage heights (`height: 100%`) require an explicit height on the parent element to resolve against; otherwise, an indefinite parent height causes `height: 100%` to compute to `auto`. Since `root>outer` has an indefinite height, `root>outer>tall` sizes itself based on its content rather than filling a percentage of the parent. Consequently, both siblings are sized identically by their content, meaning `root>outer>tall` is not taller than `root>outer>filler`.

ANSWER: NO
