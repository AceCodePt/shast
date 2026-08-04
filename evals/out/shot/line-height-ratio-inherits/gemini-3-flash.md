# line-height-ratio-inherits — opencode/gemini-3-flash

- arm: `shot`
- probes: a unitless line-height inheriting as a ratio rather than a length
- expected: 64 — the unitless 2 inherits as a ratio and re-resolves against 32px, rather than inheriting the root's computed 32px line box
- parsed answer: `64`
- verdict: **PASS**
- elapsed: 9446ms
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

When a unitless `line-height` (like `2`) is declared on a parent element, the multiplier itself is inherited by its descendants rather than a fixed pixel value. For the `root>big` element, which has a `font-size` of `32px`, the inherited `line-height` multiplier of `2` is applied to its own font size. This results in a calculated line height of `32px * 2 = 64px`, which determines the rendered height of the div.

ANSWER: 64
