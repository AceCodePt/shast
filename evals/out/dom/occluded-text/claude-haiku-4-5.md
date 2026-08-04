# occluded-text — opencode/claude-haiku-4-5

- arm: `dom`
- probes: an opaque positioned box hides the text of an in-flow box under it
- expected: NO — the banner paints an opaque background over its lines
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 10243ms

## Question

Can a person reading this page in a browser read the whole sentence in `root>lede`?

## Context shown to the model


```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root         div
root>lede    p    "The quarterly results are in and every region beat its targ…" (72 chars)
root>body    p    "Details follow in the table below."
root>banner  div

Below is the browser's own data for each node — `getBoundingClientRect()` and `getComputedStyle()`:

root <div>
  getBoundingClientRect: x=0 y=0 width=600 height=300
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 300px
  left: 0px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: relative
  top: 0px
  width: 600px
  z-index: auto
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>lede <p>
  getBoundingClientRect: x=0 y=0 width=600 height=54.375
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 54.375px
  left: auto
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  top: auto
  width: 600px
  z-index: auto
  padding: 8px 8px 8px 8px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>body <p>
  getBoundingClientRect: x=0 y=54.375 width=600 height=35.1875
  background-color: rgba(0, 0, 0, 0)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 35.1875px
  left: auto
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: static
  top: auto
  width: 600px
  z-index: auto
  padding: 8px 8px 8px 8px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px

root>banner <div>
  getBoundingClientRect: x=0 y=0 width=600 height=70
  background-color: rgb(34, 34, 34)
  color: rgb(0, 0, 0)
  display: block
  font-size: 16px
  height: 70px
  left: 0px
  line-height: 19.2px
  opacity: 1
  overflow: visible
  position: absolute
  top: 0px
  width: 600px
  z-index: 5
  padding: 0px 0px 0px 0px
  border-width: 0px 0px 0px 0px
  margin: 0px 0px 0px 0px
```

## Model reply

Looking at the provided information:

The `root>lede` element is a `<p>` tag with the text "The quarterly results are in and every region beat its targ…" (72 chars). The ellipsis ("…") at the end indicates the text is truncated in the display.

According to the getBoundingClientRect data, `root>lede` has:
- width: 600px
- height: 54.375px
- It's positioned at the top of the root div (y=0)

The `root>banner` div is positioned absolutely with `top: 0px`, `z-index: 5`, and `height: 70px`. This means the banner overlays the top 70 pixels of the viewport, which completely covers the `root>lede` paragraph (which only extends to y=54.375px).

Additionally, even if the banner didn't obscure it, the text itself is truncated with an ellipsis, meaning the full sentence is not fully visible on the screen.

A person reading this page would neither be able to see the complete text due to truncation, nor would they be able to read what is visible due to the absolutely-positioned banner covering it.

ANSWER: NO
