import type { AffiliatesMap } from '../config.ts';

/**
 * Auto-detect and load an affiliates config file.
 *
 * Resolution order (first match wins):
 *   affiliates.config.ts
 *   affiliates.config.js
 *   affiliates.config.mjs
 *   affiliates.config.jsonc
 *   affiliates.config.json
 *   affiliates.config.yaml
 *   affiliates.config.yml
 *
 * If `explicitPath` is provided, only that file is tried.
 *
 * v0.1 implementation pending — see ./ts.ts, ./json.ts, ./yaml.ts.
 */
export async function loadAffiliatesConfig(
  _projectRoot: string,
  _explicitPath?: string,
): Promise<{ path: string; map: AffiliatesMap }> {
  throw new Error('[astro-recommends] loadAffiliatesConfig: not yet implemented');
}
