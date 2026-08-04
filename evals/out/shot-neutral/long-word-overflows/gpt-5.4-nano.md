# long-word-overflows — opencode/gpt-5.4-nano

- arm: `shot`
- probes: an unbreakable token wider than its box
- expected: NO — there is no break opportunity in the URL, so the single word runs to ~518px and is painted outside the box
- parsed answer: `NO`
- verdict: **PASS**
- elapsed: 9346ms
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

The evidence shows that the entire URL text `https://example.com/a/very/long/path/that/never/breaks` is the contents of the `root>cell` element. Since the URL is a very long, effectively unbreakable string (“that/never/breaks” contains no natural breakpoints), there’s no reason to expect it to wrap to fit a 120px-wide box; instead, the likely behavior for such “long-word-overflows” is to overflow the container. Therefore, the URL does not stay contained within the 120px-wide `root>cell` box.  

ANSWER: NO
