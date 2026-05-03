---
"astro-recommends": minor
---

Initial public release.

**Integration**

- Default export `recommends(options)` — Astro integration.
- Hooks: `astro:config:setup` loads + validates the affiliates config and injects the `astro-recommends:resolved` virtual module; `astro:build:setup` walks `src/content/**/*.{md,mdx}` and validates `<Aff>` slug usage; `astro:build:done` writes the redirects file to `dist/`.
- Options: `basePath` (default `/recommends`), `target` (`'cloudflare' | 'netlify'`), `validate` (`'strict' | 'warn' | 'off'`, default `strict`), `defaults.rel`, `defaults.target`, optional explicit `config` path.

**Component**

- `<Aff slug="…">label</Aff>` from `astro-recommends/components`. Renders a cloaked anchor at `{basePath}/{slug}` with the resolved `rel` and `target`. Per-element props (`rel`, `target`, `class`) override the integration defaults.

**Config**

- `defineAffiliates(map)` identity helper with Zod schema validation. Each entry: `url` (required, must be a valid URL), optional `label`, optional `note` (author bookkeeping, never rendered). Slugs must be URL-safe (lowercase letters, digits, hyphens; no leading/trailing hyphen).
- Auto-detection of `affiliates.config.{ts,mts,js,mjs,jsonc,json,yaml,yml}`. TypeScript configs loaded via jiti — no consumer build step required.

**Targets**

- Cloudflare Pages and Netlify `_redirects` formats. Snapshot-tested.

**Migration**

- Reference script in `examples/import-thirstyaffiliates.mjs` for pulling existing affiliates from a WordPress site running ThirstyAffiliates via the public WP REST API. Built-in CLI planned for v0.2.
