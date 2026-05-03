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
- Slug prop is re-validated at render time against the URL-safe regex.
- `noopener` is forced on the rendered `rel` whenever `target='_blank'`, even if the author overrides `rel`. Prevents reverse tabnabbing.

**Config**

- `defineAffiliates(map)` identity helper with Zod schema validation. Each entry: `url` (required, must be valid http(s)), optional `label`, optional `note` (author bookkeeping, never rendered). Slugs must be URL-safe (lowercase letters, digits, hyphens; no leading/trailing hyphen).
- URL scheme allowlist: `http://` and `https://` only. `javascript:`, `data:`, `file:`, `vbscript:` are rejected at config-load time.
- URLs containing CR or LF characters are rejected to prevent redirect-rule injection in the generated `_redirects`.
- Auto-detection of `affiliates.config.{ts,mts,js,mjs,jsonc,json,yaml,yml}`. TypeScript configs loaded via jiti — no consumer build step required.

**Targets**

- Cloudflare Pages and Netlify `_redirects` formats. Snapshot-tested.

**Build-time content scan**

- Walks `src/content/**/*.{md,mdx}`, detects `<Aff slug="…">` references, surfaces unknown/unused entries via the configured mode.
- Tag-aware regex bounds matches within a single `<Aff>` tag (no cross-tag misattribution from decoy tokens in prose).

**Migration**

- Reference script in `examples/import-thirstyaffiliates.mjs` for pulling existing affiliates from a WordPress site running ThirstyAffiliates via the public WP REST API. Built-in CLI planned for v0.2.

**Supply chain**

- All GitHub Actions in CI and release workflows pinned to commit SHAs (not version tags). Dependabot configured to keep them current.
- Release workflow publishes with npm provenance attestations enabled.
- Dedicated `SECURITY.md` documents the threat model and consumer hardening recommendations.
