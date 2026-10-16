# Variants

A **variant** is a copy of the project used as the source for a benchmark run.
`shast` vendors each variant through the same `add()` a consumer uses, so the
measured tree is exactly what `shast add` would write.

A variant directory must contain a `src/` directory: `shast add` vendors
`<variant>/src` into `bench/.generated/<variant>/<tier>/shast`. The repository's
own `src` is the default variant, spelled `src`, and is **not** a directory
here - it is vendored from the repository root. Every other variant is a
directory in this folder, for example `bench/variants/scratch/src`.

Create a throwaway variant to compare against the default:

```sh
mkdir -p bench/variants/scratch
cp -r src bench/variants/scratch/src
pnpm bench -- --variants src,scratch --tiers common
rm -rf bench/variants/scratch
```

The variant's `src/` is the only per-variant difference; scenarios and their
generated tsconfigs are shared across every variant and tier.
