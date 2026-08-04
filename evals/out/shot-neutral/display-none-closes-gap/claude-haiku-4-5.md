# display-none-closes-gap — opencode/claude-haiku-4-5

- arm: `shot`
- probes: whether a `display: none` box still occupies space in the flow
- expected: NO — `display: none` removes the box from the flow entirely, so `root>third` starts at y=40
- parsed answer: `YES`
- verdict: **FAIL (answer-line slip or no reply)**
- elapsed: 8531ms
- attached: `page.png`

## Question

`root>gone` sits between `root>first` and `root>third` and is `display: none`. Is there a 40px vertical gap between `root>first` and `root>third` where it would have been?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root        div
root>first  div  "first"
root>gone   div  "gone"
root>third  div  "third"

Attached is a screenshot of the rendered page at 600x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

Looking at the screenshot and the node tree information provided:

The screenshot shows "first" at the top and "third" below it with significant white space between them. The node tree indicates that `root>gone` (which has `display: none`) sits between these two elements in the DOM.

When an element has `display: none`, it is completely removed from the document flow - it takes up no space at all. However, the screenshot clearly shows a large vertical gap between "first" and "third" where the `gone` element would have been rendered if it were visible.

Since `display: none` removes the element from the flow entirely and should take up zero space, but we observe a 40px gap in the rendered output, this indicates that the CSS is NOT properly handling the display property - the element is still taking up space despite being hidden.

ANSWER: YES
