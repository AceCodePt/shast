# repair-dead-hover — opencode/claude-haiku-4-5

- arm: `shot`
- probes: naming the block that is killing a state, not the state's own block
- expected: root — its `> mid > leaf` block is (0,3,0) and outranks the leaf's own `:hover` at (0,2,0), so the hover is dead until the root's block changes
- parsed answer: `root>mid`
- verdict: **FAIL (answer-line slip or no reply)**
- elapsed: 6396ms
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

Looking at the evidence:

1. The CSS rule `:hover { padding: 40px }` has already been added to `root>mid>leaf`'s own css block
2. The two screenshots show that hovering on `root>mid>leaf` produces no visible change
3. This means the `:hover` rule on `root>mid>leaf` itself is not working

The most likely reason is that a parent element (specifically `root>mid`) is preventing the hover state from being detected or applied to the child. In CSS, if a parent element doesn't have `pointer-events: auto` or similar settings, or if there's a positioning/overflow issue, the child's hover state may not trigger properly.

Since the `:hover` rule is already correctly placed on `root>mid>leaf` but isn't working, the problem must be in the parent container's CSS. The parent `root>mid` needs to be configured to allow hover events to properly reach and affect its child.

ANSWER: root>mid
