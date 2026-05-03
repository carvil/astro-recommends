# astro-recommends

> Affiliate link cloaking for Astro. One config file → edge redirects + an `<Aff>` MDX component. A static-site replacement for ThirstyAffiliates.

[![npm](https://img.shields.io/npm/v/astro-recommends.svg)](https://www.npmjs.com/package/astro-recommends)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Why

Affiliate-link plugins like ThirstyAffiliates lock you to WordPress. The actual job — mapping a cloaked URL on your domain to an external affiliate destination, with the right `rel` attributes, plus refusing to render unknown slugs — is small enough to do at build time. `astro-recommends` does that, with one source-of-truth config and a typed component for inline use.

## Status

**v0.1** — first public release. The API is small and intentionally so; expect minor additions before 1.0, no breaking changes are planned. See [CHANGELOG.md](./CHANGELOG.md).

Targets: **Cloudflare Pages**, **Netlify**.

## Install

```bash
pnpm add astro-recommends
# or
npm install astro-recommends
```

Requires Astro 5 or 6 and Node 18.17+.

## Quick start

**1. Add the integration:**

```ts
// astro.config.mjs
import { defineConfig } from 'astro/config';
import recommends from 'astro-recommends';

export default defineConfig({
  integrations: [
    recommends({
      basePath: '/go',           // URL prefix for cloaked links — any path works
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

**2. Define your affiliates:**

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
    note: '15% commission via Amazon Associates, expires 2027-01-01',
  },
});
```

**3. Use the `<Aff>` component in MDX:**

```mdx
---
title: My post
---
import { Aff } from 'astro-recommends/components';

I cite <Aff slug="deep-work">Deep Work</Aff> in every other essay.
```

**4. Build:**

```bash
pnpm build
```

The build emits `dist/_redirects` (Cloudflare/Netlify format):

```
/go/deep-work                 https://www.amazon.com/dp/1455586692?tag=yourtag-20  302
/go/good-strategy-bad-strategy https://www.amazon.com/dp/0307886239?tag=yourtag-20  302
```

The `<Aff>` component renders:

```html
<a href="/go/deep-work" rel="sponsored nofollow noopener" target="_blank">Deep Work</a>
```

If you reference an unknown slug (typo, deleted entry), the build **fails** under `validate: 'strict'` with a clean prefixed error pointing at the file. Under `'warn'` it logs and continues. Under `'off'` it skips the scan.

## How it works

- **Build-time redirect generation.** The integration writes a `_redirects` file to your build output (Cloudflare Pages or Netlify format). The redirect runs at the edge of your CDN — no JS, no server-side handler, no runtime cost.
- **Virtual module for the component.** `astro:config:setup` injects `astro-recommends:resolved` (a Vite virtual module) carrying the resolved `basePath` + `defaults`. The `<Aff>` component reads from it at render time, so changing `basePath` or `defaults` in your `astro.config.mjs` doesn't require touching components.
- **Content scan validation.** Before the build runs, the integration walks `src/content/**/*.{md,mdx}` looking for `<Aff slug="…">` references. Slugs not in your config raise an error (or warning); slugs in your config but never cited are reported as info.

## Configuration reference

### Integration options

```ts
recommends({
  basePath?: string;        // default: '/recommends'. Must start with '/'.
  target: 'cloudflare' | 'netlify';
  config?: string;          // explicit path; auto-detected otherwise (see below)
  validate?: 'strict' | 'warn' | 'off';  // default: 'strict'
  defaults?: {
    rel?: string[];         // default: ['sponsored', 'nofollow', 'noopener']
    target?: '_blank' | '_self' | '_parent' | '_top';  // default: '_blank'
  };
})
```

### Affiliate entries

```ts
defineAffiliates({
  '<slug>': {
    url: string;            // required. Must be a valid URL.
    label?: string;         // optional. Used for accessibility / fallback rendering.
    note?: string;          // optional. Author bookkeeping — never rendered.
  },
});
```

Slugs must be URL-safe: lowercase letters, digits, and hyphens only; no leading or trailing hyphen. The slug is the *key* in the map (not a field), keeping the file diff-friendly when you add or reorder entries.

### Per-element overrides

The `<Aff>` component accepts:

```mdx
<Aff
  slug="deep-work"
  rel={['sponsored']}        // overrides defaults.rel
  target="_self"             // overrides defaults.target
  class="my-affiliate-class" // forwarded to the rendered <a>
>
  Deep Work
</Aff>
```

The body of the `<Aff>` tag is the rendered link text. Use it like any other inline component.

## Config file formats

`astro-recommends` auto-detects the config in this order, relative to your project root:

1. `affiliates.config.ts`
2. `affiliates.config.mts`
3. `affiliates.config.js`
4. `affiliates.config.mjs`
5. `affiliates.config.jsonc`
6. `affiliates.config.json`
7. `affiliates.config.yaml`
8. `affiliates.config.yml`

Override with the `config` integration option.

TypeScript is recommended for autocomplete, type checking, and inline comments (`note` fields are great for tracking commission rates, expiry dates, etc). JSON / JSONC / YAML are accepted for users who don't want TS or who generate config from another tool. TS configs are loaded via [jiti](https://github.com/unjs/jiti) — no consumer build step required.

## Migration from ThirstyAffiliates

The fast path: ThirstyAffiliates exposes its `thirstylink` custom post type via the public WP REST API on **all** plans (no Pro upgrade required). A reference script lives at [`examples/import-thirstyaffiliates.mjs`](./examples/import-thirstyaffiliates.mjs):

```bash
node examples/import-thirstyaffiliates.mjs \
  --site https://yourdomain.com \
  --out  ./affiliates.config.ts
```

Set your integration's `basePath` to match your existing WP cloak prefix (e.g. `/go` or `/recommends`) so every existing in-content link, RSS reader cache, and external share keeps resolving to the same destination.

A built-in `npx astro-recommends import-thirsty` is planned for v0.2.

## Security

See [SECURITY.md](./SECURITY.md) for the threat model, hardening enforced by the library (URL scheme allowlist, CR/LF rejection, forced `noopener` on `target='_blank'`, slug re-validation at render time), and consumer recommendations (CODEOWNERS on `affiliates.config.ts`, periodic destination audits, npm provenance verification).

## Roadmap

- **v0.2**: Vercel + nginx targets. Built-in `import-thirsty` CLI. Optional `/<basePath>/` index page generator.
- **v0.3**: Per-entry `rel`/`target` overrides via the virtual module.
- **v1**: Optional Cloudflare Worker click tracker (KV/D1) for per-link analytics. **Stance:** no per-visitor identifiers without explicit opt-in; aggregate counters only by default.

## License

MIT © Carlos Vilhena
