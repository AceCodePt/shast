# percent-height-indefinite — opencode/claude-haiku-4-5

- arm: `shot`
- probes: a percentage height whose containing block is indefinite
- expected: NO — `root>outer` has no declared height, so the percentage behaves as `auto` and `tall` is one line (~19px) against `filler`'s 60px
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 6121ms
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

Looking at the rendered page information and screenshot:

The node tree shows:
- `root>outer>filler` contains "a"
- `root>outer>tall` contains "b"

From the screenshot, both elements appear to be on the same vertical level with minimal height. The element containing "b" does not visually appear taller than the element containing "a".

When `root>outer>tall` declares `height: 100%`, it's trying to be 100% of its parent's height (`root>outer`). However, the parent's height is determined by its content. Since the parent likely has an indefinite (auto) height, the `height: 100%` on `root>outer>tall` would resolve to `auto` as well, giving it no height advantage over its sibling. Both elements end up being their natural text height.

ANSWER: NO
