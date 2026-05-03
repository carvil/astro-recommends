# CLAUDE.md — astro-recommends

Open-source npm package providing affiliate link cloaking for Astro sites. Replaces ThirstyAffiliates for users moving from WordPress to static. MIT-licensed, published from `github.com/carvil/astro-recommends`.

## Why this exists

The author (Carlos Vilhena) is migrating his personal blog `carlosvilhena.com` off WordPress. ThirstyAffiliates manages 71 cloaked affiliate links on his current site (`/go/<slug>/` → Amazon affiliate URLs). No maintained Astro/static-site library does this cleanly. We're building the smallest sharp tool that does.

The library is **dogfooded** on `carlosvilhena.com` (sibling repo at `~/Documents/Personal/carlosvilhena.com/`). Real-world data set: 71 entries, all amazon.com / amzn.to with the `carlosvilhena-20` tag baked in.

## Architectural choices (and why)

- **Astro-only in v0.1.** Not a framework-agnostic core + adapters layer. Premature abstraction without a second consumer. Extract later if Eleventy/Next users ask.
- **TypeScript config primary** (`affiliates.config.ts` exporting `defineAffiliates({...})`); JSON, JSONC, YAML accepted as alternates with auto-detection. TS gets autocomplete + type checking; alternates exist for users who don't want TS or generate config from another tool.
- **No build step.** Library ships TS source directly via `exports` map. Astro consumers compile it through their own pipeline. Avoids dist/ duplication, build tool dependency, sourcemap config. May revisit if non-Astro consumers appear.
- **Zod for schema validation** at config load. Bad config fails the build with a clear message, not a runtime mystery.
- **Generate redirects, don't intercept requests.** Edge static (`_redirects` file) is faster, simpler, and survives the library being uninstalled. No Cloudflare Worker required for v0.1.
- **`/go/` is not the default.** Default `basePath` is `/recommends/` for new users, but it's a string the consumer sets. carlosvilhena.com configures `/go/` to preserve URLs — never hardcode either.

## Public API (v0.1 target)

```ts
import recommends, { defineAffiliates } from 'astro-recommends';
import { Aff } from 'astro-recommends/components';
```

- `recommends(options)` — Astro integration (default export of main entry).
  - `basePath: string` (default `/recommends`)
  - `target: 'cloudflare' | 'netlify'`
  - `config?: string` — explicit path; auto-detected otherwise
  - `validate: 'strict' | 'warn' | 'off'` (default `strict`)
  - `defaults: { rel?: string[]; target?: '_blank' | '_self'; nofollow?: boolean; ... }`
- `defineAffiliates(map)` — identity helper for type inference; consumers default-export the call.
- `<Aff slug="..." [overrides...]>label</Aff>` — renders `<a href="{basePath}/{slug}" rel="..." target="...">label</a>`.

Per-entry override fields (in `affiliates.config.ts` entries) take precedence over `defaults`.

## Repo layout

```
src/
  index.ts            # public entry — exports defineAffiliates + integration default
  integration.ts      # Astro integration: load config, hook into build, write redirects, run validation
  config.ts           # Zod schema, defineAffiliates(), Affiliate / AffiliatesMap / Defaults types
  components.ts       # barrel: re-exports Aff from .astro
  components/
    Aff.astro         # renders the cloaked anchor
  loaders/
    index.ts          # detect-and-load orchestrator
    ts.ts             # dynamic import of *.config.{ts,js,mjs}
    json.ts           # parse JSON / JSONC
    yaml.ts           # parse YAML
  targets/
    index.ts          # dispatch by target name
    cloudflare.ts     # _redirects generator
    netlify.ts        # _redirects generator (similar but distinct)
  validate.ts         # scan src/content/**/*.{md,mdx} for <Aff slug> + bare hrefs; cross-check
test/
  *.test.ts           # vitest specs
  fixtures/           # tiny config + content fixtures
examples/
  README.md           # example consumer setup (eventually a runnable demo)
```

## Conventions

- **No default exports of business logic.** Default export reserved for the integration. Everything else is named.
- **Errors with the package name prefix.** `throw new Error('[astro-recommends] ...')` — easy to grep in user logs.
- **Snapshot-test redirect output.** Per target. If we change format, the diff is visible in PR review.
- **No `console.log` in shipped code** — use Astro's logger via the integration context (`logger.info(...)`).

## Commands

```bash
pnpm install
pnpm test          # vitest run
pnpm test:watch
pnpm typecheck     # tsc --noEmit
pnpm changeset     # author a changeset entry before merging
pnpm release       # publish to npm (CI will normally do this)
```

## Release process

1. Author a `pnpm changeset` per change (patch/minor/major + summary).
2. Merge to main. The release workflow opens a "Version Packages" PR.
3. Merge that PR → CI publishes to npm and tags the release.

## Out of scope (intentionally) for v0.1

- Vercel / nginx targets (v0.2)
- ThirstyAffiliates CSV importer (v0.2 — biggest adoption hook)
- Auto-generated `/recommends/` index page (v0.2, opt-in)
- Click tracking / analytics (v1, optional Cloudflare Worker)
- Frameworks other than Astro

## Sister project

`carlosvilhena.com` (Astro site, sibling directory). Uses this lib via local link during dev. The 71-entry affiliate dataset there is the primary integration test. When in doubt about a design choice, optimize for that use case first.
