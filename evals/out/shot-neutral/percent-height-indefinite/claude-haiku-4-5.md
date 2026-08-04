# percent-height-indefinite — opencode/claude-haiku-4-5

- arm: `shot`
- probes: a percentage height whose containing block is indefinite
- expected: NO — `root>outer` has no declared height, so the percentage behaves as `auto` and `tall` is one line (~19px) against `filler`'s 60px
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 8117ms
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

Looking at the node tree and screenshot:

The node tree shows:
- `root>outer>filler` contains text "a"
- `root>outer>tall` contains text "b" and declares `height: 100%`

From the screenshot, I can see that "a" appears near the top of the viewport, and "b" appears slightly below it. Both elements appear to be roughly the same height - they're both single lines of text with minimal vertical space.

Since `root>outer>tall` has `height: 100%`, it would take 100% of its parent's (`root>outer`) height. However, the parent `root>outer` likely has a height determined by its content or other styling. The screenshot shows that the element containing "b" is not visibly taller than the element containing "a" - they appear to be approximately the same size.

If `root>outer>tall` were actually 100% of the parent height, it would extend much further down the page than what's visible in the screenshot. The fact that it doesn't suggests either: (1) the parent has indefinite height (making 100% resolve to auto), or (2) the layout isn't behaving as a simple percentage would suggest.

ANSWER: NO
