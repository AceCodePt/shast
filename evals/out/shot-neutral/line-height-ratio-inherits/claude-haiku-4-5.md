# line-height-ratio-inherits — opencode/claude-haiku-4-5

- arm: `shot`
- probes: a unitless line-height inheriting as a ratio rather than a length
- expected: 64 — the unitless 2 inherits as a ratio and re-resolves against 32px, rather than inheriting the root's computed 32px line box
- parsed answer: `32`
- verdict: **FAIL (misread)**
- elapsed: 8348ms
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

- `root` declares `font-size: 16px` and `line-height: 2`
- `root>big` declares `font-size: 32px` and nothing else

The key here is understanding how `line-height` inheritance works. When `line-height` is specified as a unitless number (like `2`), it's a multiplier that gets inherited as a computed value based on the **parent's** `font-size`.

For `root`: `line-height: 2` × `font-size: 16px` = computed line-height of `32px`

When `root>big` inherits from `root`, it inherits the computed `line-height` value of `32px` (not the multiplier). The `root>big` element has `font-size: 32px` but inherits the line-height of `32px` from its parent.

Therefore, `root>big` renders with a line-height of `32px`.

ANSWER: 32
