# repair-dead-hover — opencode/gemini-3-flash

- arm: `shot`
- probes: naming the block that is killing a state, not the state's own block
- expected: root — its `> mid > leaf` block is (0,3,0) and outranks the leaf's own `:hover` at (0,2,0), so the hover is dead until the root's block changes
- parsed answer: `root>mid`
- verdict: **FAIL (answer-line slip or no reply)**
- elapsed: 27469ms
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

The identical screenshots indicate that the `:hover` style on `root>mid>leaf` is not being triggered, a condition known as a "dead hover." This typically occurs when a parent element has the CSS property `pointer-events: none` applied to it, which prevents all mouse interactions (including hovers) from reaching its child elements. Since the `:hover` rule is already correctly defined in `root>mid>leaf`'s own CSS block but is failing to execute, the obstruction exists at a higher level in the DOM tree, specifically in the parent node `root>mid`. Editing the `root>mid` block to remove or override the property that disables pointer events will allow the hover state to reach the leaf.

ANSWER: root>mid
