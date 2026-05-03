# Security Policy

## Supported versions

Only the latest minor release receives security fixes. v0.x means the API may evolve before 1.0.

## Reporting a vulnerability

If you find a security issue, please **do not** open a public issue. Instead, open a [GitHub private security advisory](https://github.com/carvil/astro-recommends/security/advisories/new) on this repo, or email the maintainer (see `package.json#author` for contact details).

I aim to respond within 5 working days, with a fix or a public disclosure timeline.

## Threat model

`astro-recommends` runs at **build time** in your Astro project. It:

1. Reads a config file (`affiliates.config.{ts,mts,js,mjs,jsonc,json,yaml,yml}`)
2. Validates it through a Zod schema
3. Walks `src/content/**/*.{md,mdx}` for `<Aff slug="...">` references
4. Writes a `_redirects` file to `dist/` (Cloudflare Pages / Netlify format)
5. Injects a virtual module the `<Aff>` component reads at render time

There is **no runtime code** in your shipped site beyond the static `<a>` tags the component emits and the `_redirects` rules your CDN serves.

### Trust boundaries

- **`astro.config.mjs` and `affiliates.config.ts` are executed as code** during your build. They have full Node privileges (filesystem, network, environment variables). Treat them with the same review discipline as any other code in your repo.
- **MDX/Markdown post authors** are a separate trust boundary. The library re-validates the `<Aff slug>` prop against a URL-safe regex and refuses to render unknown slugs (under `validate: 'strict'`). Authors **cannot** introduce arbitrary destinations — only reference slugs already in the config.

### Hardening enforced by the library

- **URL scheme allowlist:** affiliate URLs must be `http(s)`. `javascript:`, `data:`, `file:`, and `vbscript:` are rejected at config-load time.
- **CR/LF rejection in URLs:** prevents redirect-rule injection (a malicious URL containing `\n` would otherwise smuggle additional `_redirects` rules into the deploy).
- **Slug shape:** `^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$` — blocks path traversal, prototype-pollution-style keys, and special characters in cloak URLs. Enforced at both config load and `<Aff>` render time.
- **`noopener` is forced when `target='_blank'`** regardless of any per-element `rel` override. Prevents reverse tabnabbing even if an author passes `rel={['sponsored']}` (which would otherwise drop the default `noopener`).
- **Strict mode by default** for content validation: unknown `<Aff>` slugs fail the build, not silently link nowhere.
- **Built-in Astro escaping** for all attribute values bound from expressions — XSS via `class`, `rel`, or `target` props is blocked by the framework, not the lib.

### Recommendations for consumers

- **Add `affiliates.config.ts` to `CODEOWNERS`** so changes require review:

  ```
  # .github/CODEOWNERS
  /affiliates.config.ts  @your-handle
  ```

- **Audit your destinations periodically.** A subdomain takeover of an affiliate destination domain (expired, re-registered) silently turns every cloaked link on your site into a redirect to the attacker. Quick check:

  ```bash
  jq -r '.[] | .url' < affiliates.config.json | xargs -I{} curl -sI --max-time 5 {} | grep -E '^(HTTP|Location:)'
  ```

  Or write a build-time check that asserts every destination returns an HTTP `2xx`/`3xx`.

- **Watch for homoglyph attacks** in URL hostnames (Cyrillic `о` for Latin `o`, etc.). The lib doesn't currently lint for this; surface destination domains in your build log so PR diffs catch it.

- **Use a granular npm token if you're publishing your own fork** — `automation` type, scoped to the specific package.

- **Branch-protect `main`** in your repo: require PR reviews, no force-push, signed commits.

### Dependency hygiene

The library has three runtime dependencies:

- `jiti` — loads TS/JS configs (executes user code, by design).
- `yaml` — parser only.
- `zod` — schema validator only.

The release workflow:

- Pins all GitHub Actions to commit SHAs (not tags).
- Runs `pnpm install --frozen-lockfile` (no lockfile drift).
- Publishes with npm provenance attestations (`NPM_CONFIG_PROVENANCE=true`, paired with `id-token: write`). Verify any installed copy with `npm audit signatures`.
- Triggers only on `push: [main]` (not `pull_request_target`), so PRs from forks cannot access `NPM_TOKEN`.
- Uses an automation-type `NPM_TOKEN` from GitHub Secrets, never echoed to logs.
