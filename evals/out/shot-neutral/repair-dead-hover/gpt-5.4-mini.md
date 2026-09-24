# repair-dead-hover — opencode/gpt-5.4-mini

- arm: `shot`
- probes: naming the block that is killing a state, not the state's own block
- expected: root — its `> mid > leaf` block is (0,3,0) and outranks the leaf's own `:hover` at (0,2,0), so the hover is dead until the root's block changes
- parsed answer: ``root>mid`
- verdict: **FAIL (misread)**
- elapsed: 31513ms
- attached: `rest.png`, `hover.png`

## Question

You want `root>mid>leaf` to grow to 40px of padding on hover. Which node's css block do you have to edit to get it?

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

The evidence above is the page exactly as it stands. Consider that `:hover { padding: 40px }` has already been added to `root>mid>leaf`'s own css block — it is there in the source — and hovering changes nothing. You are not shown a rendering of the outcome — work it out from the evidence.
```

## Model reply

The leaf’s own `:hover` block is dead because the hover is being caught by its parent box, not by the leaf element itself. To make the leaf grow on hover, you need to put the hover rule on the node that is actually hovered and then style the leaf from there.

ANSWER: `root>mid`
