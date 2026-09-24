# long-word-overflows — opencode/claude-haiku-4-5

- arm: `shot`
- probes: an unbreakable token wider than its box
- expected: NO — there is no break opportunity in the URL, so the single word runs to ~518px and is painted outside the box
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 6440ms
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

Looking at the screenshot provided, I can see the URL "https://example.com/a/very/long/path/that/never/breaks" is displayed at the top of the page.

The URL text appears to extend beyond the visible boundary on the right side of the image, which suggests it overflows the 120px-wide box. A URL of that length (approximately 56 characters) would require significantly more than 120 pixels of width to display without wrapping or breaking, especially in a monospace or default font.

From the visual evidence in the screenshot, the text clearly extends beyond what would fit in a 120px-wide container without any text wrapping or word-breaking CSS applied.

ANSWER: NO
