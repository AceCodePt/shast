# display-none-closes-gap — opencode/gpt-5.4-nano

- arm: `shot`
- probes: whether a `display: none` box still occupies space in the flow
- expected: NO — `display: none` removes the box from the flow entirely, so `root>third` starts at y=40
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 11207ms
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

`root>gone` is `display: none`, and elements with `display: none` are not part of the layout flow, so they do not contribute any height/margins/padding (or reserve space) where they would otherwise render. The authoritative rendered DOM evidence shows only the nodes `first` and `third` as visible siblings in the page; nothing indicates that an empty 40px region was left open between them.  

ANSWER: NO
