# percent-height-indefinite — opencode/glm-5

- arm: `resolved`
- probes: a percentage height whose containing block is indefinite
- expected: NO — `root>outer` has no declared height, so the percentage behaves as `auto` and `tall` is one line (~19px) against `filler`'s 60px
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 19318ms

## Question

`root>outer>tall` declares `height: 100%`. Is it taller than its sibling `root>outer>filler`?

## Context shown to the model


```
viewport 600x400
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root               div
  @ x=0 y=0 width=600 height=79.19

root>outer         div
  @ x=0 y=0 width=600 height=79.19

root>outer>filler  div  "a"
  @ x=0 y=0 width=600 height=60
  = font-size: 16px (inherited), height: 60px

root>outer>tall    div  "b"
  @ x=0 y=60 width=600 height=19.19
  = font-size: 16px (inherited), height: 100%
```

## Model reply

## Reasoning

`root>outer>tall` declares `height: 100%`, but percentage heights only resolve against the parent's height when that height is **explicitly set** (not determined by content).

Here, `root>outer` has no explicit height — its 79.19px is the *sum of its children's rendered heights* (auto-sized by content). Because the parent height is content-driven, the `100%` on `tall` cannot resolve against it and instead falls back to `auto`, meaning `tall`'s height is determined by its own content (the text "b").

That content is a single line of text at the inherited 16px font-size with the default line-height (~1.2), yielding 16 × 1.2 ≈ 19.2px — which matches the measured 19.19px.

So:
- `root>outer>filler`: **60px**
- `root>outer>tall`: **19.19px**

19.19 < 60, so `tall` is shorter than its sibling, not taller.

ANSWER: NO
