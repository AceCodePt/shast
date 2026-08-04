# display-none-closes-gap — opencode/claude-haiku-4-5

- arm: `resolved`
- probes: whether a `display: none` box still occupies space in the flow
- expected: NO — `display: none` removes the box from the flow entirely, so `root>third` starts at y=40
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 7091ms

## Question

`root>gone` sits between `root>first` and `root>third` and is `display: none`. Is there a 40px vertical gap between `root>first` and `root>third` where it would have been?

## Context shown to the model


```
viewport 600x400
@ = border box [x, y, width, height], in CSS px — x and y are absolute from the top-left of the page, already resolved, not relative to the parent

root        div
  @ x=0 y=0 width=600 height=80

root>first  div  "first"
  @ x=0 y=0 width=600 height=40
  = font-size: 16px (inherited), height: 40px

root>gone   div  "gone"
  @ x=0 y=0 width=0 height=0  hidden
  = font-size: 16px (inherited), display: none, height: 40px
  ! hidden: display: none

root>third  div  "third"
  @ x=0 y=40 width=600 height=40
  = font-size: 16px (inherited), height: 40px
```

## Model reply

Looking at the report:

- `root>first` occupies y=0 to y=40 (height: 40px)
- `root>gone` has `display: none` and is hidden (@ shows width=0 height=0)
- `root>third` occupies y=40 to y=80 (height: 40px)

Since `root>gone` has `display: none`, it is removed from the document flow entirely and takes up no space. The `root>third` div is positioned immediately after `root>first` with no gap between them (third starts at y=40, which is where first ends). There is no 40px vertical gap where the hidden element would have been—the hidden element simply doesn't affect the layout at all.

ANSWER: NO
