# Changesets

This directory holds [changeset](https://github.com/changesets/changesets) entries — one Markdown file per change. Each describes the bump (patch/minor/major) and a summary, which becomes the entry in `CHANGELOG.md` on release.

To author a changeset locally:

```bash
pnpm changeset
```

Pick the bump kind, write a one-line summary, commit alongside your code change. The release workflow on `main` will pick it up.
