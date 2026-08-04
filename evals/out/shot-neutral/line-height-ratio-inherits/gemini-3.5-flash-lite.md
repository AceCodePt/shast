# line-height-ratio-inherits — opencode/gemini-3.5-flash-lite

- arm: `shot`
- probes: a unitless line-height inheriting as a ratio rather than a length
- expected: 64 — the unitless 2 inherits as a ratio and re-resolves against 32px, rather than inheriting the root's computed 32px line box
- parsed answer: `64`
- verdict: **PASS**
- elapsed: 9042ms
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

When a unitless number is used for `line-height` (such as `line-height: 2`), the scaling factor is inherited by child elements rather than a fixed pixel value. Therefore, `root>big` inherits the ratio `2` and applies it to its own `font-size` of `32px`, resulting in a line-height of `32px * 2 = 64px`. Since a single line of text renders with a height equal to its line-height, `root>big` renders 64 pixels tall.

ANSWER: 64
