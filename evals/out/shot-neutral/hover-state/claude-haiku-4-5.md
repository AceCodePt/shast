# hover-state — opencode/claude-haiku-4-5

- arm: `shot`
- probes: reading a state delta without mistaking it for the resting style
- expected: #3355ff (or the same colour written any other way)
- parsed answer: `blue`
- verdict: **FAIL (misread)**
- elapsed: 7295ms
- attached: `rest.png`, `hover.png`

## Question

What is the background colour of `root>cta` when the page is first painted and the pointer is elsewhere?

## Context shown to the model

![rest.png](rest.png)
![hover.png](hover.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 400x300

root      div
root>cta  div  "Continue"

Two screenshots of the rendered page are attached, both 400x300 CSS px at 1 device pixel per CSS px: first the page at rest, then the page while the mouse hovers `root>cta`. Compare them.
```

## Model reply

Looking at the first screenshot (rest.png), which shows the page at rest with the pointer elsewhere, I can see the "Continue" button has a blue background.

The button occupies the top portion of the 400x300 viewport and displays the text "Continue" in black text against this solid blue background color. The blue appears to be a standard bright/royal blue color.

ANSWER: blue
