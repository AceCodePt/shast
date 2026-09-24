# percent-height-indefinite — opencode/qwen3.5-plus

- arm: `shot`
- probes: a percentage height whose containing block is indefinite
- expected: NO — `root>outer` has no declared height, so the percentage behaves as `auto` and `tall` is one line (~19px) against `filler`'s 60px
- parsed answer: `YES`
- verdict: **FAIL (answer-line slip or no reply)**
- elapsed: 15157ms
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

Looking at the screenshot, element "b" (which is `root>outer>tall`) has significant white space extending below it, indicating its container is quite tall. Element "a" (`root>outer>filler`) appears as just the text with no extra vertical space.

Since `root>outer>tall` has `height: 100%`, it takes up the full height of its parent container, making it much taller than `root>outer>filler` which only has its natural text height.

ANSWER: YES
