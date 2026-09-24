# largest-by-area — opencode/gpt-5.4-nano

- arm: `shot`
- probes: the winner on area is neither the widest nor the tallest, so grabbing one axis fails
- expected: root>square (48400px²; wide and tall are 36000px² each, and neither the widest nor the tallest box wins)
- parsed answer: `root>square`
- verdict: **PASS**
- elapsed: 11578ms
- attached: `page.png`

## Question

Which of the three boxes covers the largest area? Area, not width and not height.

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 700x420

root         div
root>wide    div  "wide"
root>tall    div  "tall"
root>square  div  "square"

Attached is a screenshot of the rendered page at 700x420 CSS px, at 1 device pixel per CSS px.
```

## Model reply

The page shows three boxes labeled `wide`, `tall`, and `square`, all as separate `div` nodes under the `root`. Since the question asks only which covers the largest **area**, the `square` box is the one whose width and height match (by its naming), making it the most likely to have the greatest combined coverage on screen compared to a stretched “wide” or “tall” rectangle.  

ANSWER: root>square
