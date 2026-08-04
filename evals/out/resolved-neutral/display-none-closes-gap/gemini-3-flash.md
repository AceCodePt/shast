# display-none-closes-gap — opencode/gemini-3-flash

- arm: `resolved`
- probes: whether a `display: none` box still occupies space in the flow
- expected: NO — `display: none` removes the box from the flow entirely, so `root>third` starts at y=40
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 8850ms

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

The information shows that `root>gone` has `display: none`, which removes it from the layout flow, causing it to occupy no space (0x0). The coordinates confirm this, as `root>first` ends at y=40 (y=0 + height=40) and `root>third` begins exactly at y=40, leaving no vertical gap between them.

ANSWER: NO
