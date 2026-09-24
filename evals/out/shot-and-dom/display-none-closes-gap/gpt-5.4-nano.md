# display-none-closes-gap — opencode/gpt-5.4-nano

- arm: `shot+dom`
- probes: whether a `display: none` box still occupies space in the flow
- expected: NO — `display: none` removes the box from the flow entirely, so `root>third` starts at y=40
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 6234ms
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

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=600 height=80
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 80px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>first <div>
  getBoundingClientRect: x=0 y=0 width=600 height=40
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 40px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>gone <div>
  getBoundingClientRect: x=0 y=0 width=0 height=0
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: none
  font-size: 16px
  height: 40px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>third <div>
  getBoundingClientRect: x=0 y=40 width=600 height=40
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 40px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

Attached is a screenshot of the rendered page at 600x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

`root>gone` has `display: none`, and its `getBoundingClientRect()` is `width=0 height=0`, meaning it does not participate in layout. `root>first` ends at `y=0 + height=40`, and `root>third` begins exactly at `y=40`. If there were a reserved 40px gap for `root>gone`, `root>third` would have started at `y=80` instead.

ANSWER: NO
