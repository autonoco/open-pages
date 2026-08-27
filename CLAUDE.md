# open-pdf — Framework Repo Guide

You are working on the **open-pdf framework** — the runtime, CLI, and tooling that ship to npm.

(Doc-authoring guidance lives in the `doc-authoring` / `create-doc` skills under `apps/demo/.claude/skills/`. Use those only when editing files inside `apps/demo/docs/`.)

## Layout

pnpm + Turbo monorepo.

| Path | Package | Role |
| --- | --- | --- |
| `packages/core` | `@autono/open-pdf` | Runtime (viewer, present mode, inspector), Vite plugin, `open-pdf` dev/build CLI. |
| `packages/cli` | `@autono/create-open-pdf` | `npm create @autono/open-pdf@latest` scaffolder + project template. |
| `apps/demo` | private | Local consumer of `@autono/open-pdf` via `workspace:*`. Dogfood target — run `pnpm dev` here to exercise the framework. |
| `apps/web` | private | Marketing site (Next.js). |

Shared config: `biome.json`, `turbo.json`, `pnpm-workspace.yaml`, `tsconfig` per package.

## Workflow

```bash
pnpm dev          # turbo: runs demo against local core
pnpm build        # build all packages
pnpm typecheck    # tsc across the graph
pnpm check        # biome (format + lint + organize imports)
pnpm check:fix    # auto-fix what biome can
pnpm test         # vitest
```

Filter to one package: `pnpm core <script>` / `pnpm cli <script>`.

## Hard rules

- **Biome must pass before commit.** Run `pnpm check` (or `pnpm check:fix`). CI and the user's review both expect a clean tree.
- **Never bump `version` in a package.json.** The git tag is the version; CI stamps it at release time.
- **Never push to `main`.** Branch, open a PR, let the maintainer merge. Every merge to `main` is a release.
- Don't add dependencies casually. The `core` runtime ships to users; every dep inflates install size.
- `packages/core/src/app/components/ui` is shadcn-generated and biome-ignored — leave it alone unless regenerating.
- **Default to writing no comments.** Only add one when the WHY is non-obvious — a hidden constraint, a subtle invariant, a workaround for a specific bug, behavior that would surprise a reader. Don't explain WHAT the code does (well-named identifiers handle that), don't reference tasks/PRs/callers ("added for X", "used by Y"), don't write section-divider banners (`// ── Section ──`) or module-header descriptions, and don't leave commented-out code. If removing a comment wouldn't confuse a future reader, don't write it.

## Releasing (reference)

Every merge to `main` runs `.github/workflows/release.yml`: it tags the next minor (`vX.Y.0`), stamps that version into `packages/core` and `packages/cli`, builds, publishes both to npm via OIDC trusted publishing with provenance, and creates a GitHub Release with generated notes. Nothing is committed back. Add `[skip release]` to a merge commit to skip. Recover a failed run with the workflow's manual dispatch and the existing tag.
