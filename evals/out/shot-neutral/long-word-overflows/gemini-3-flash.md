# long-word-overflows — opencode/gemini-3-flash

- arm: `shot`
- probes: an unbreakable token wider than its box
- expected: NO — there is no break opportunity in the URL, so the single word runs to ~518px and is painted outside the box
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 9511ms
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

The URL "https://example.com/a/very/long/path/that/never/breaks" is 61 characters long. In a standard rendering, 61 characters will significantly exceed a 120px width, as even a very narrow font would require more than 2 pixels per character. The screenshot confirms that the text renders on a single line and extends across most of the 600px-wide viewport, clearly overflowing the 120px boundary of the cell.

ANSWER: NO
