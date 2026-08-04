# repair-dead-hover — opencode/glm-5

- arm: `resolved`
- probes: naming the block that is killing a state, not the state's own block
- expected: root — its `> mid > leaf` block is (0,3,0) and outranks the leaf's own `:hover` at (0,2,0), so the hover is dead until the root's block changes
- parsed answer: `root`
- verdict: **PASS**
- elapsed: 27943ms

## Question

You want `root>mid>leaf` to grow to 40px of padding on hover. Which node's css block do you have to edit to get it?

## Context shown to the model


```
viewport 500x300
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root           div
  @ x=0 y=0 width=500 height=23.19

root>mid       div
  @ x=0 y=0 width=500 height=23.19

root>mid>leaf  div  "Leaf"
  @ x=0 y=0 width=500 height=23.19  dead-state
  = font-size: 16px (inherited), padding: 2px
  ! dead-state: `:hover` sets padding: 40px, but padding: 2px declared by root inside its "> mid > leaf" block outranks it — entering `:hover` does not change padding
  ← padding: 2px   declared by root, inside its "> mid > leaf" block   (adds)

The evidence above is the page exactly as it stands. Consider that `:hover { padding: 40px }` has already been added to `root>mid>leaf`'s own css block — it is there in the source — and hovering changes nothing. You are not shown a rendering of the outcome — work it out from the evidence.
```

## Model reply

## Reasoning

The evidence tells us two things about where the rules live:

1. **`padding: 2px`** is declared in **`root`'s CSS block**, using a `> mid > leaf` selector. That selector chains three classes/elements, giving it high specificity — roughly (0, 3, 0).

2. **`:hover { padding: 40px }`** is already in **`root>mid>leaf`'s own CSS block**. A self-selector like `.leaf:hover` only carries roughly (0, 2, 0) specificity.

Because (0, 3, 0) > (0, 2, 0), the `:hover` rule on the leaf's own block can never outrank the `padding: 2px` coming from `root`'s `> mid > leaf` block — no matter what we do inside the leaf's own block (we can't conjure extra selector specificity from a single node's self-selector). The only way to get a `:hover` rule with enough specificity to win is to put it in the **same block that already owns the winning selector** — `root`'s block — where a `> mid > leaf:hover` selector would carry (0, 4, 0) and beat the base (0, 3, 0).

ANSWER: root
