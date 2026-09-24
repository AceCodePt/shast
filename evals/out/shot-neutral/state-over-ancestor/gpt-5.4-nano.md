# state-over-ancestor — opencode/gpt-5.4-nano

- arm: `shot`
- probes: a state delta on top of a three-level cascade, where the resting winner is not the node's own
- expected: 2px — the root's three-segment selector outranks the node's own :hover, so hovering changes nothing
- parsed answer: `0px`
- verdict: **FAIL (misread)**
- elapsed: 10600ms
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

The rendered DOM shows only `div` elements with the leaf text `"Leaf"`; there’s no evidence of any other boxes/borders that would suggest nonzero spacing. Comparing the two 500x300 screenshots (rest vs. hover), the text position doesn’t shift in a way consistent with added padding on `root>mid>leaf`, so its padding while hovered is the same as its default—effectively none.

ANSWER: 0px
