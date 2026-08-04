# display-none-closes-gap — opencode/qwen3.5-plus

- arm: `shot`
- probes: whether a `display: none` box still occupies space in the flow
- expected: NO — `display: none` removes the box from the flow entirely, so `root>third` starts at y=40
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 14131ms
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

Looking at the screenshot, I can see "first" and "third" text with no visible gap between them. The element `root>gone` has `display: none`, which completely removes an element from the layout flow—it doesn't occupy any space at all. This is different from `visibility: hidden`, which would preserve the space. The screenshot confirms this behavior: "third" appears directly below "first" with no 40px gap where the "gone" element would have been.

ANSWER: NO
