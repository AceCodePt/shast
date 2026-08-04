# line-height-ratio-inherits — opencode/qwen3.5-plus

- arm: `shot`
- probes: a unitless line-height inheriting as a ratio rather than a length
- expected: 64 — the unitless 2 inherits as a ratio and re-resolves against 32px, rather than inheriting the root's computed 32px line box
- parsed answer: `32`
- verdict: **FAIL (misread)**
- elapsed: 14903ms
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

The `root` element sets `line-height: 2` (a unitless multiplier), which computes to `16px × 2 = 32px` on root itself. However, `line-height` inherits as the **computed value** (32px), not as the unitless multiplier. So `root>big` inherits `line-height: 32px` while overriding `font-size` to `32px`. The element's height is determined by its line-height.

ANSWER: 32
