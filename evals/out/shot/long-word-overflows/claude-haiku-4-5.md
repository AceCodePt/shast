# long-word-overflows — opencode/claude-haiku-4-5

- arm: `shot`
- probes: an unbreakable token wider than its box
- expected: NO — there is no break opportunity in the URL, so the single word runs to ~518px and is painted outside the box
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 6666ms
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

Looking at the screenshot and the node tree information:

The node tree shows that `root>cell` is a div containing the text "https://example.com/a/very/long/path/that/never/breaks". According to the question, this element has a 120px-wide box constraint.

From the screenshot, I can see the URL text is displayed on a single line at the top of the viewport. The text appears to extend well beyond 120 pixels in width - the full URL "https://example.com/a/very/long/path/that/never/breaks" is quite long and clearly takes up much more horizontal space than 120px would allow.

Since the URL text visibly overflows beyond what a 120px-wide box could contain, the content does not stay inside the constrained box.

ANSWER: NO
