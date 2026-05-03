# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Versioning is driven by [Changesets](https://github.com/changesets/changesets) — see `.changeset/`.

## [Unreleased]

### Added
- Initial repository scaffold: package.json, tsconfig, vitest config, changesets, GitHub Actions CI/release workflows, MIT LICENSE, README.
- Project conventions documented in `CLAUDE.md`.

### Planned for v0.1.0
- `defineAffiliates()` config helper with Zod schema validation.
- Astro integration entry that loads config and hooks into the build.
- `<Aff slug="...">label</Aff>` component (`astro-recommends/components`).
- Redirect generation for **Cloudflare Pages** (`_redirects`) and **Netlify** (`_redirects`).
- Build-time slug validation: scan content collections for `<Aff>` and bare `/<basePath>/` hrefs; fail or warn on unknown/unused slugs.
- Configurable `basePath`, default `rel`/`target`, per-entry overrides.
- Auto-detection of TS / JSON / JSONC / YAML config formats.
- vitest snapshot tests per redirect target.
