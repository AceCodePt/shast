# percent-height-indefinite — opencode/gpt-5.4-nano

- arm: `shot`
- probes: a percentage height whose containing block is indefinite
- expected: NO — `root>outer` has no declared height, so the percentage behaves as `auto` and `tall` is one line (~19px) against `filler`'s 60px
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 12213ms
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

`root>outer` has no explicit height stated in the evidence, so `root>outer>tall`’s `height: 100%` cannot resolve to a definite computed height. In Chromium’s rendered output, both sibling nodes appear to occupy only their content-sized height (the screenshot shows `b` not stretched beyond what `filler` would naturally do). Therefore, `tall` is not taller than `filler` on the rendered page.

ANSWER: NO
