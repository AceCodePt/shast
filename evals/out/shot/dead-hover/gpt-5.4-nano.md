# dead-hover — opencode/gpt-5.4-nano

- arm: `shot`
- probes: a `:hover` block that is overruled, which is invisible unless it is reported
- expected: NO — the root's `> mid > leaf` block outranks the :hover, so the hover declaration is dead
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 8369ms
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

Hovering would normally apply `padding: 40px` to `root>mid>leaf`, which should visibly change the layout by increasing the space around the `Leaf` text (e.g., shifting it away from the div’s edge and making the div’s occupied area larger). Comparing the two provided 500x300 screenshots (rest vs. hover), the rendered appearance does not show any such change in where the `Leaf` text sits. Therefore, hovering does not appear to change its padding.

ANSWER: NO
