#!/usr/bin/env node
/**
 * Import affiliate links from a WordPress site running ThirstyAffiliates
 * into an `affiliates.config.ts` for `astro-recommends`.
 *
 * ThirstyAffiliates exposes its `thirstylink` custom post type via the
 * public WP REST API — even on the free plan, no Pro upgrade needed.
 * This script pulls the JSON, normalises the shape, and writes a config
 * file your Astro site can import directly.
 *
 * Usage:
 *
 *   node examples/import-thirstyaffiliates.mjs \
 *     --site https://yourdomain.com \
 *     --out  ./affiliates.config.ts
 *
 * The cloak prefix on your existing site (e.g. /go/<slug>/ or
 * /recommends/<slug>/) is whatever WordPress is configured to serve.
 * Set the same `basePath` in your astro-recommends integration config
 * to keep every existing in-content link working after migration.
 *
 * MIT — part of astro-recommends.
 */

import { writeFile } from 'node:fs/promises';
import { argv, exit } from 'node:process';

function parseArgs() {
  const args = { site: null, out: './affiliates.config.ts' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--site' || a === '-s') args.site = argv[++i];
    else if (a === '--out' || a === '-o') args.out = argv[++i];
    else if (a === '--help' || a === '-h') {
      console.log(
        'Usage: node import-thirstyaffiliates.mjs --site <url> [--out <path>]',
      );
      exit(0);
    }
  }
  if (!args.site) {
    console.error('error: --site <url> is required');
    exit(1);
  }
  if (!/^https?:\/\//.test(args.site)) {
    console.error(`error: --site must include scheme (got "${args.site}")`);
    exit(1);
  }
  return args;
}

async function fetchAllThirstyLinks(siteUrl) {
  // HostGator and other shared hosts often block the default Node fetch UA
  // via ModSecurity rules — a normal browser-style UA gets through.
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/json,*/*;q=0.8',
  };
  const all = [];
  let page = 1;
  for (;;) {
    const url = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/thirstylink?per_page=100&page=${page}`;
    const r = await fetch(url, { headers });
    if (!r.ok) {
      throw new Error(`request failed: ${r.status} ${r.statusText} (${url})`);
    }
    const batch = await r.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 100) break;
    page++;
  }
  return all;
}

function toEntry(raw) {
  const slug = raw.slug;
  const url = raw._ta_destination_url;
  const label = raw.title?.rendered ?? slug;
  if (!slug || !url) return null;
  return { slug, url, label };
}

function jsonString(s) {
  return JSON.stringify(s);
}

function renderConfigSource(entries) {
  const lines = [
    "import { defineAffiliates } from 'astro-recommends';",
    '',
    '/**',
    ' * Generated from a WordPress / ThirstyAffiliates source by',
    ' * import-thirstyaffiliates.mjs. Each entry preserves its original',
    ' * slug so existing /<basePath>/<slug>/ links keep resolving after',
    ' * migration. Configure the same basePath in your integration to',
    ' * match the WP cloak prefix exactly.',
    ' */',
    'export default defineAffiliates({',
  ];
  const sorted = [...entries].sort((a, b) => a.slug.localeCompare(b.slug));
  for (const e of sorted) {
    lines.push(`  ${jsonString(e.slug)}: {`);
    lines.push(`    url: ${jsonString(e.url)},`);
    if (e.label) lines.push(`    label: ${jsonString(e.label)},`);
    lines.push('  },');
  }
  lines.push('});');
  return lines.join('\n') + '\n';
}

async function main() {
  const { site, out } = parseArgs();
  console.error(`fetching from ${site} …`);
  const raw = await fetchAllThirstyLinks(site);
  console.error(`fetched ${raw.length} entr${raw.length === 1 ? 'y' : 'ies'}`);
  const entries = raw.map(toEntry).filter(Boolean);
  if (entries.length < raw.length) {
    console.error(`note: ${raw.length - entries.length} entr(ies) skipped (missing slug or url)`);
  }
  const source = renderConfigSource(entries);
  await writeFile(out, source, 'utf8');
  console.error(`wrote ${out} (${entries.length} entr${entries.length === 1 ? 'y' : 'ies'})`);
  console.error('');
  console.error('Next steps:');
  console.error('  1. Add astro-recommends to your astro.config.mjs integrations.');
  console.error('  2. Set basePath to match your WP cloak prefix (e.g. "/go" or "/recommends").');
  console.error('  3. Build — _redirects gets generated alongside your site.');
}

main().catch((err) => {
  console.error(`\n[import-thirstyaffiliates] ${err.message ?? err}`);
  exit(1);
});
