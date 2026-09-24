# long-word-overflows — opencode/gpt-5.4-nano

- arm: `shot`
- probes: an unbreakable token wider than its box
- expected: NO — there is no break opportunity in the URL, so the single word runs to ~518px and is painted outside the box
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 8624ms
- attached: `page.png`

## Question

Does the URL in `root>cell` stay inside `root>cell`'s 120px-wide box?

## Context shown to the model

![page.png](page.png)

```
The node tree, one line per node — path, tag, and the text as written in the source. CSS can change how that text renders, so treat the evidence below as authoritative for what is actually on screen:

viewport 600x400

root       div
root>cell  div  "https://example.com/a/very/long/path/that/never/breaks"

Attached is a screenshot of the rendered page at 600x400 CSS px, at 1 device pixel per CSS px.
```

## Model reply

The evidence shows the URL text rendered inside `root>cell` as `https://example.com/a/very/long/path/that/never/breaks`. In the attached 600×400 screenshot, the full long URL is visible rather than being clipped to the cell’s 120px width, which implies it extends beyond the `root>cell` box instead of staying within it.  

ANSWER: NO
