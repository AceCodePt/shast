# line-height-ratio-inherits — opencode/claude-haiku-4-5

- arm: `shot`
- probes: a unitless line-height inheriting as a ratio rather than a length
- expected: 64 — the unitless 2 inherits as a ratio and re-resolves against 32px, rather than inheriting the root's computed 32px line box
- parsed answer: `64`
- verdict: **PASS**
- elapsed: 6062ms
- attached: `page.png`

## Question

`root` declares `font-size: 16px` and `line-height: 2`. `root>big` declares `font-size: 32px` and nothing else. How tall does `root>big` render?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root        div
root>small  div  "small"
root>big    div  "big"

Attached is a screenshot of the rendered page at 600x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

Looking at the information provided:

- `root` has `font-size: 16px` and `line-height: 2`
- `root>big` has `font-size: 32px` and nothing else (no line-height specified)

Since `root>big` doesn't declare its own `line-height`, it inherits from its parent (`root`). The `line-height: 2` on the parent is a unitless number, which means it's a multiplier based on the element's own font size, not the parent's.

For `root>big`: 
- It inherits the unitless value `2` from its parent
- This multiplier applies to `root>big`'s own `font-size: 32px`
- Therefore: `line-height = 2 × 32px = 64px`

The height that `root>big` renders is 64 CSS pixels.

ANSWER: 64
