# long-word-overflows — opencode/qwen3.5-plus

- arm: `shot`
- probes: an unbreakable token wider than its box
- expected: NO — there is no break opportunity in the URL, so the single word runs to ~518px and is painted outside the box
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 12239ms
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

Looking at the screenshot, the URL text `https://example.com/a/very/long/path/that/never/breaks` appears as a single continuous line that extends across the viewport. Since the container (`root>cell`) is only 120px wide and the URL contains no natural break points (no spaces or hyphens), the text overflows horizontally beyond the container boundaries rather than wrapping or breaking.

ANSWER: NO
