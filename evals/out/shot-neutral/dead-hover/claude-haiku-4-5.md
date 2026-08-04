# dead-hover — opencode/claude-haiku-4-5

- arm: `shot`
- probes: a `:hover` block that is overruled, which is invisible unless it is reported
- expected: NO — the root's `> mid > leaf` block outranks the :hover, so the hover declaration is dead
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 7094ms
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

I'll analyze the two screenshots to compare the rendering at rest versus on hover.

Looking at the "rest" screenshot, the "Leaf" text appears to be positioned in the upper-left area of the viewport with minimal spacing around it.

Looking at the "hover" screenshot, the "Leaf" text appears to be in the exact same position and with the same spacing around it.

If the `:hover` block was successfully applying `padding: 40px`, the "Leaf" text would move inward (away from the edges) and the element's bounding box would expand outward by 40px on all sides. This would be visually apparent as the text moving to a different position within the element. However, between the two screenshots, the "Leaf" text maintains the same visual position and spacing.

This indicates that the `:hover` block with `padding: 40px` is not being applied when hovering over the element.

ANSWER: NO
