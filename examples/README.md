# Examples

## `import-thirstyaffiliates.mjs`

Pulls affiliate links from a WordPress site running ThirstyAffiliates and writes them to `affiliates.config.ts` for `astro-recommends`. ThirstyAffiliates exposes its `thirstylink` custom post type via the public WP REST API — works on the free plan, no Pro upgrade needed.

```bash
node import-thirstyaffiliates.mjs \
  --site https://yourdomain.com \
  --out  ./affiliates.config.ts
```

Set the integration's `basePath` to match your existing WP cloak prefix (`/go` or `/recommends`) so every existing in-content link, RSS reader cache, and external share keeps resolving to the same destination.

Built and tested against carlosvilhena.com (71 entries, all preserved byte-for-byte). The script has no dependencies — Node 18.17+ has `fetch` built in.
