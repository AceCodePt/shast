# hover-state — opencode/gpt-5.4-nano

- arm: `shot`
- probes: reading a state delta without mistaking it for the resting style
- expected: #3355ff (or the same colour written any other way)
- parsed answer: `blue`
- verdict: **FAIL (misread)**
- elapsed: 9653ms
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

The node tree shows `root>cta` contains the text “Continue”. In the first (rest) screenshot, when the pointer is elsewhere, the area corresponding to `root>cta` is shown with a solid blue background (contrasting with the white background elsewhere). Therefore, the background colour of `root>cta` on first paint is blue.  

ANSWER: blue
