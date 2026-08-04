# state-over-ancestor — opencode/qwen3.5-plus

- arm: `shot`
- probes: a state delta on top of a three-level cascade, where the resting winner is not the node's own
- expected: 2px — the root's three-segment selector outranks the node's own :hover, so hovering changes nothing
- parsed answer: `0px`
- verdict: **FAIL (misread)**
- elapsed: 12635ms
- attached: `rest.png`, `hover.png`

## Question

What padding does `root>mid>leaf` render with while the pointer is hovering over it?

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

Looking at both screenshots (rest and hover states), the "Leaf" text appears in the exact same position - flush against the top-left corner of its container in both images. There is no visible spacing between the text and the container edges in either screenshot, and the hover state doesn't appear to change the layout at all.

ANSWER: 0px
