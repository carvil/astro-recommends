/**
 * astro-recommends — public entry.
 *
 * Default export: the Astro integration.
 * Named exports: defineAffiliates() helper, plus types.
 *
 * The <Aff> component is exposed via the './components' subpath
 * (see package.json#exports) — Astro/MDX consumers do:
 *
 *   import { Aff } from 'astro-recommends/components';
 */

export { default } from './integration.ts';
export { defineAffiliates } from './config.ts';
export type {
  Affiliate,
  AffiliatesMap,
  Defaults,
  IntegrationOptions,
  Target,
  ValidateMode,
} from './config.ts';
