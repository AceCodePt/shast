# long-word-overflows — opencode/gemini-3-flash

- arm: `shot`
- probes: an unbreakable token wider than its box
- expected: NO — there is no break opportunity in the URL, so the single word runs to ~518px and is painted outside the box
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 11331ms
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

The URL "https://example.com/a/very/long/path/that/never/breaks" is a long, continuous string without spaces. In the provided screenshot of the 600px-wide viewport, the URL renders on a single line and occupies a significant portion of the total width, clearly exceeding the 120px (20% of the viewport) limit. Because long words do not break by default, the text overflows the container.

ANSWER: NO
