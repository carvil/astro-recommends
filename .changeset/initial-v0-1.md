---
"astro-recommends": minor
---

Initial v0.1 surface:

- `defineAffiliates()` config helper with Zod schema validation.
- Astro integration default export — loads config, injects a virtual module for the `<Aff>` component, validates content references, and writes the redirects file at build time.
- `<Aff slug="...">label</Aff>` component (`astro-recommends/components`) reading basePath + rel/target defaults from the integration via `astro-recommends:resolved`.
- Auto-detection of `affiliates.config.{ts,mts,js,mjs,jsonc,json,yaml,yml}`. TS configs loaded via jiti — no build step required in the consumer's project.
- Redirect generators for **Cloudflare Pages** and **Netlify** (snapshot-tested).
- Build-time content scan: detects unknown slugs referenced in `<Aff>` usages and unused entries defined in config. Configurable via `validate: 'strict' | 'warn' | 'off'`.
- Configurable `basePath` (default `/recommends`); per-entry rel/target overrides; global defaults applied otherwise.
