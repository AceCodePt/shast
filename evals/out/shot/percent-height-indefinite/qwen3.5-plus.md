# percent-height-indefinite — opencode/qwen3.5-plus

- arm: `shot`
- probes: a percentage height whose containing block is indefinite
- expected: NO — `root>outer` has no declared height, so the percentage behaves as `auto` and `tall` is one line (~19px) against `filler`'s 60px
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 21737ms
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

Looking at the screenshot, I can see two elements: "a" (filler) at the top and "b" (tall) below it. Both elements appear to have roughly the same height - just enough to contain their text content.

The `height: 100%` on `root>outer>tall` did not make it fill the viewport or become significantly taller than its sibling. This is because percentage heights require the parent element to have an explicit/definite height, which apparently isn't the case here in the ancestor chain.

ANSWER: NO
