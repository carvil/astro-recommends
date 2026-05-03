import { access } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { affiliatesMapSchema, type AffiliatesMap } from '../config.ts';
import { loadJsonConfig } from './json.ts';
import { loadYamlConfig } from './yaml.ts';
import { loadTsConfig } from './ts.ts';

export const SEARCH_ORDER = [
  'affiliates.config.ts',
  'affiliates.config.mts',
  'affiliates.config.js',
  'affiliates.config.mjs',
  'affiliates.config.jsonc',
  'affiliates.config.json',
  'affiliates.config.yaml',
  'affiliates.config.yml',
] as const;

async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function loadByExtension(filepath: string): Promise<unknown> {
  if (/\.(ts|mts|cts|js|mjs|cjs)$/.test(filepath)) return loadTsConfig(filepath);
  if (/\.jsonc?$/.test(filepath)) return loadJsonConfig(filepath);
  if (/\.ya?ml$/.test(filepath)) return loadYamlConfig(filepath);
  throw new Error(`[astro-recommends] unrecognised config extension: ${filepath}`);
}

export async function loadAffiliatesConfig(
  projectRoot: string,
  explicitPath?: string,
): Promise<{ path: string; map: AffiliatesMap }> {
  let resolved: string | null = null;

  if (explicitPath) {
    const abs = isAbsolute(explicitPath) ? explicitPath : join(projectRoot, explicitPath);
    if (!(await fileExists(abs))) {
      throw new Error(`[astro-recommends] config not found at explicit path: ${abs}`);
    }
    resolved = abs;
  } else {
    for (const name of SEARCH_ORDER) {
      const p = join(projectRoot, name);
      if (await fileExists(p)) {
        resolved = p;
        break;
      }
    }
  }

  if (!resolved) {
    throw new Error(
      `[astro-recommends] no affiliates config found. Searched ${SEARCH_ORDER.join(', ')} in ${projectRoot}`,
    );
  }

  const raw = await loadByExtension(resolved);
  const parsed = affiliatesMapSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(
      `[astro-recommends] invalid affiliates config in ${resolved}:\n${issues}`,
    );
  }

  return { path: resolved, map: parsed.data };
}
