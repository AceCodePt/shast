# Shast resolved-node format

A flat, per-node representation of a rendered component in which every node's
style is fully resolved, and every contested property carries its provenance.

Two consumers, one artifact:

- the `=` line answers **"what does this look like"** — complete, self-contained
- the `←` lines answer **"why, and who set it"** — only present when contested

## The merge

A node's style is the union of contributions from:

1. its **own** `css` block
2. every **ancestor** rule whose selector path resolves to it
   (`> panel` from its parent, `> body > panel` from the root, and so on)

Union is per-property. A parent adding `padding` does not disturb a child's
`color`. Only same-property collisions have a winner.

### Precedence

Emitted selectors decide, so the resolver **must** derive this from the same
code path as `renderComponent` rather than reimplementing it. Whichever rule
holds, state it once here and test it:

- if all rules emit at equal specificity, **source order** wins
- if ancestor rules emit with more attribute selectors, **the ancestor** wins,
  and among ancestors the one contributing the most selector segments wins

Record the ordering the resolver actually observed. A resolver that disagrees
with the emitter produces a confident description of a page that does not
exist — worse than no description, because nothing surfaces the divergence.

## JSON

```jsonc
{
  "viewport": { "w": 1440, "h": 900, "dpr": 1 },   // required, document-level
  "nodes": [{
    "path": "root>body>panel",     // '>' joined innerHTML keys; unique per node
    "tag": "section",
    "text": null,                   // string innerHTML, else null
    "opaque": false,                // img | svg | canvas | video
    "box": [264, 88, 936, 420],     // required — x, y, w, h in CSS px
    "flags": ["scrolls"],           // wrapped | scrolls | clipped | offscreen | zero
    "style": {
      "flex":    { "value": "1",             "from": "own" },
      "color":   { "value": "var(--fg)",
                   "from": "root > body > panel",
                   "shadows": [ { "value": "var(--fg-muted)", "from": "own" } ] },
      "padding": { "value": "16px", "from": "root>body \"> panel\"" }
    },
    "states": {                     // pseudo-classes, same shape
      "hover": { "bg": { "value": "var(--surface-hover)", "from": "own" } }
    }
  }]
}
```

`from` is `"own"` or the **declaring node's path plus the selector key** that
matched — enough to jump straight to the source location. `shadows` lists
losing declarations in descending precedence; absent when uncontested.

`box` is not optional. A node without a measured box is a failed extraction,
not a node with unknown geometry — emit an error rather than a record. Silent
absence would let a consumer describe a layout it never measured.

## Geometry

Boxes come from a render pass over `renderComponent`'s output. There is no
static substitute: text-driven heights, wrapping, and flex resolution all
depend on font metrics and content, and guessing them produces numbers that
look authoritative and are wrong.

The pass is cheap here because shast emits `cid-<name>` attributes. Boxes
rejoin the semantic tree by exact key lookup rather than heuristic matching —
the author's names survive the round trip through the browser:

```js
const { html, css } = renderComponent(component);
await page.setContent(`<style>${css}</style>${html}`);
await page.evaluate(() => {
  const out = {};
  for (const el of document.querySelectorAll('*')) {
    const cid = [...el.attributes].find(a => a.name.startsWith('cid-'));
    if (!cid) continue;
    const r = el.getBoundingClientRect();
    out[cid.name.slice(4)] = [r.x, r.y, r.width, r.height].map(Math.round);
  }
  return out;
});
```

Two obligations that follow:

- **Record the viewport.** A box is true at one width. Emit the viewport at
  document level, and if the component is responsive, emit one document per
  breakpoint rather than one document with ambiguous boxes.
- **Record the content.** Boxes are measured against the text actually
  present. A node sized by a three-word label is not the same node with a
  sentence in it. If you measure with placeholder content, say so.

`flags` carry the facts a single rectangle can't: `wrapped` (a flex row that
broke onto multiple lines), `scrolls`, `clipped` (content exceeds the box),
`offscreen`, `zero` (rendered at no size — usually a bug worth surfacing).

## Text rendering

```
viewport 1440x900

<path>   <tag>   "<text>"
  @ [x, y, w, h]  <flags>
  = <every resolved property, comma separated>
  ← <contributor>   <props it won>   shadows <losing value>
  ← <contributor>   <props it won>   (adds)
  : <state>  <resolved properties for that state>
```

Rules:

- The `@` and `=` lines together are **complete**. Never require reading `←`
  lines to know how a node looks or where it sits. Provenance is supplementary,
  never load-bearing.
- `@` always precedes `=`. Position is what a reader needs first; the
  properties explain it. Omit flags when there are none.
- Emit `←` lines **only when an ancestor contributed**. Most nodes have none.
- Mark each contribution `(adds)` or `shadows <value>`. The distinction is the
  whole point: `(adds)` is composition working as designed; `shadows` means two
  places both had an opinion, which is where refactoring bugs live.
- Opaque nodes get their box, plus aspect ratio, `object-fit`, radius, and
  border. Nothing about depicted content.
- Path, not indentation. Each line stands alone under sorting or filtering.

## Example

```
viewport 1440x900

root                     div
  @ [0, 0, 1200, 532]
  = flex column, gap 16, padding 24, bg --surface, radius 12

root>header              div
  @ [24, 24, 1152, 28]
  = flex row, align center, gap 8

root>header>title        h1     "Billing"
  @ [24, 24, 78, 28]
  = 20px/600, color --fg, letter-spacing -0.01
  ← root "> header > title"   color: --fg              shadows own --fg-muted
  ← root "> header > title"   letter-spacing: -0.01    (adds)

root>header>badge        span   "Pro"
  @ [110, 28, 41, 20]
  = 12px/500, color --on-accent, bg --accent, radius 9999, padding 2 8

root>body                div
  @ [24, 68, 1152, 440]
  = flex row, gap 24

root>body>rail           nav
  @ [24, 68, 240, 440]  scrolls
  = 240px, flex column, gap 4

root>body>panel          section
  @ [288, 68, 888, 440]
  = flex 1, padding 16, gap 8, radius 12, bg --surface-raised
  ← root>body "> panel"       padding: 16, radius: 12  (adds)
  ← root "> body > panel"     bg: --surface-raised     shadows own --surface

root>body>panel>chart    canvas
  @ [304, 84, 856, 481]  clipped
  = aspect 16/9, radius 8
```

Read straight off it: `header` is a 28px-tall strip with `title` at the left
edge and `badge` beside it; `body` splits 240 / 888 with a 24px gutter, so the
panel is roughly 3.7× the rail. `title` renders `--fg` because the root
overrode its own `--fg-muted`. `panel` got its padding and radius from its
parent without touching its own declarations. And `chart` is `clipped` — its
16/9 aspect at 856px wide computes to 481px tall inside a 440px parent, which
no reading of the CSS alone would have surfaced.

## What this leaves for the model

Everything inside a line is now arithmetic, already done — including geometry,
which was previously an inference and is now a measurement. What remains needs
relations *between* lines, which is genuinely a model's job:

- 240 beside 888 → a fixed rail with a panel nearly four times its width
- three nodes sharing `--surface` → one visual plane despite three containers
- sizes, weights, and box areas across siblings → emphasis order
- boxes that overlap, or gaps between them → grouping the nesting doesn't state

That last one is worth calling out. Visual grouping produced by proximity —
two nodes that read as a pair because they sit 4px apart while everything else
is 24px away — is invisible in the tree and obvious in the boxes. It was the
single thing every evaluated model said a flat list needed geometry for.

Shadowed properties are also worth surfacing on their own: a node whose own
declaration never survives is either a leftover from a refactor or a sign the
style belongs in the parent. Types cannot flag it — both declarations are
valid — but it is visible at a glance in this format.
