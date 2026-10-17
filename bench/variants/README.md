# Variants

A **variant** is a copy of the project used as the source for a benchmark run.
`shast` vendors each variant through the same `add()` a consumer uses, so the
measured tree is exactly what `shast add` would write.

A variant directory must contain a `src/` directory: `shast add` vendors
`<variant>/src` into `bench/.generated/<variant>/<tier>/shast`. The repository's
own `src` is the default variant, spelled `src`, and is **not** a directory
here - it is vendored from the repository root. Every other variant is a
directory in this folder.

## `piped`

[`piped/`](piped/README.md) recodes the attribute authoring shape from an array
of single arms (`["'ltr'", "'rtl'"]`) to one piped DSL string
(`"'ltr' | 'rtl'"`), so the two shapes measure against the same scenarios:

```sh
pnpm bench -- --variants src,piped
```

Every variant shares the scenario corpus and their generated tsconfigs; the
variant's `src/` is the only per-variant difference.
