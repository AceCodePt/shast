# dead-hover — opencode/claude-haiku-4-5

- arm: `shot`
- probes: a `:hover` block that is overruled, which is invisible unless it is reported
- expected: NO — the root's `> mid > leaf` block outranks the :hover, so the hover declaration is dead
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 6470ms
- attached: `rest.png`, `hover.png`

## Question

`root>mid>leaf` has a `:hover` block setting `padding: 40px`. Does hovering over it change its padding?

## Context shown to the model

![rest.png](rest.png)
![hover.png](hover.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 500x300

root           div
root>mid       div
root>mid>leaf  div  "Leaf"

Two screenshots of the rendered page are attached, both 500x300 CSS px at 1 device pixel per CSS px: first the page at rest, then the page while the mouse hovers `root>mid>leaf`. Compare them.
```

## Model reply

Looking at the two screenshots provided:

1. **Rest state (first image)**: The "Leaf" text appears in the upper left area of the viewport
2. **Hover state (second image)**: The "Leaf" text appears in the same position, with no visible change in spacing around it

If the `:hover` block were actually applying `padding: 40px` to `root>mid>leaf`, we would expect to see the text move down and to the right by 40px in the hover screenshot, as the padding would create internal space around the text element. The two images appear virtually identical in terms of the "Leaf" text positioning and spacing.

This suggests that either the `:hover` rule is not being applied, or the padding declaration is not taking effect for some reason (perhaps the element is not receiving the hover state, or there's a CSS specificity issue).

ANSWER: NO
