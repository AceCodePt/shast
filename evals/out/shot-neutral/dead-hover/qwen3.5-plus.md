# dead-hover — opencode/qwen3.5-plus

- arm: `shot`
- probes: a `:hover` block that is overruled, which is invisible unless it is reported
- expected: NO — the root's `> mid > leaf` block outranks the :hover, so the hover declaration is dead
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 11265ms
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

Looking at both screenshots:

1. **Rest state**: The "Leaf" text appears in the top-left corner of the viewport
2. **Hover state**: The "Leaf" text appears in the exact same position with no visible change in spacing

If the `:hover` block's `padding: 40px` had taken effect, the text would visibly shift inward from the edges or the element would expand. Since both screenshots are identical, the padding does not change when hovering.

ANSWER: NO
