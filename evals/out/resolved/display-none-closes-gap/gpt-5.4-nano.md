# display-none-closes-gap — opencode/gpt-5.4-nano

- arm: `resolved`
- probes: whether a `display: none` box still occupies space in the flow
- expected: NO — `display: none` removes the box from the flow entirely, so `root>third` starts at y=40
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 7118ms

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

`root>gone` has `display: none`, and the report shows its box has `width=0 height=0` at `x=0 y=0`, so it does not occupy any space in layout. `root>first` is measured as `height=40` ending at `y=40`, and `root>third` starts exactly at `y=40` with `height=40`. Therefore there is no 40px vertical gap between them.

ANSWER: NO
