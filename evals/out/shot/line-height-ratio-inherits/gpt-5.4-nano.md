# line-height-ratio-inherits — opencode/gpt-5.4-nano

- arm: `shot`
- probes: a unitless line-height inheriting as a ratio rather than a length
- expected: 64 — the unitless 2 inherits as a ratio and re-resolves against 32px, rather than inheriting the root's computed 32px line box
- parsed answer: `64`
- verdict: **PASS**
- elapsed: 9567ms
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

`line-height: 2` on `root` is an inheritable value, and it’s a unitless number that acts as a multiplier of the element’s `font-size`. `root>big` overrides `font-size` to `32px` but does not set `line-height`, so it inherits `2`. Therefore `root>big` uses `line-height = 2 × 32px = 64px` for its single line.

ANSWER: 64
