# astro-recommends

> Affiliate link cloaking for Astro. One config file → edge redirects + an `<Aff>` component. A static-site replacement for ThirstyAffiliates.

[![npm](https://img.shields.io/npm/v/astro-recommends.svg)](https://www.npmjs.com/package/astro-recommends)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Why

Affiliate-link plugins like ThirstyAffiliates lock you to WordPress. The actual job — mapping a cloaked URL on your domain to an external affiliate destination, with the right `rel` attributes — is a few lines of redirect rules. `astro-recommends` does that at build time, with one source-of-truth config and a typed component for inline use.

## Status

**v0.1 — in development.** Public API may change before 1.0. See [CHANGELOG.md](./CHANGELOG.md).

Targets supported in v0.1: **Cloudflare Pages**, **Netlify**.
Planned for v0.2: Vercel, nginx, ThirstyAffiliates CSV importer.

## Install

```bash
pnpm add astro-recommends
# or
npm install astro-recommends
```

## Quick start

```ts
// astro.config.mjs
import { defineConfig } from 'astro/config';
import recommends from 'astro-recommends';

export default defineConfig({
  integrations: [
    recommends({
      basePath: '/go',           // URL prefix for cloaked links
      target: 'cloudflare',      // 'cloudflare' | 'netlify'
      validate: 'strict',        // 'strict' | 'warn' | 'off'
      defaults: {
        rel: ['sponsored', 'nofollow', 'noopener'],
        target: '_blank',
      },
    }),
  ],
});
```

```ts
// affiliates.config.ts
import { defineAffiliates } from 'astro-recommends';

export default defineAffiliates({
  'deep-work': {
    url: 'https://www.amazon.com/dp/1455586692?tag=yourtag-20',
    label: 'Deep Work',
  },
  'good-strategy-bad-strategy': {
    url: 'https://www.amazon.com/dp/0307886239?tag=yourtag-20',
    label: 'Good Strategy Bad Strategy',
  },
});
```

```mdx
---
title: My post
---
import { Aff } from 'astro-recommends/components';

I cite <Aff slug="deep-work">Deep Work</Aff> in every other essay.
```

At build time:
- `public/_redirects` (or Netlify equivalent) gets `/go/deep-work  https://...  302`
- `<Aff slug="deep-work">Deep Work</Aff>` renders `<a href="/go/deep-work" rel="sponsored nofollow noopener" target="_blank">Deep Work</a>`
- Build fails (or warns) if a `<Aff slug>` references an unknown entry

## Config formats

`astro-recommends` auto-detects in this order: `affiliates.config.ts` → `.js` → `.mjs` → `.jsonc` → `.json` → `.yaml` / `.yml`. Override with the `config` integration option.

TypeScript is recommended (autocomplete, type checking, comments). JSON/YAML are accepted for users who prefer plain data files or generate config from another tool.

## Migration from ThirstyAffiliates

Coming in v0.2: `npx astro-recommends import-thirsty <export.csv>`.

Until then: ThirstyAffiliates exposes the `thirstylink` custom post type via the public WP REST API (`/wp-json/wp/v2/thirstylink?per_page=100`) — even on the free plan. Pull JSON, transform to `affiliates.config.ts`. A reference script lives in [`examples/`](./examples/).

## Configuration reference

See [API.md](./API.md) (TODO before v0.1 release).

## License

MIT © Carlos Vilhena
