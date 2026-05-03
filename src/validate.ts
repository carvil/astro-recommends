import type { AffiliatesMap, ValidateMode } from './config.ts';

export interface ValidationResult {
  unknownSlugs: { slug: string; file: string; line?: number }[];
  unusedSlugs: string[];
}

/**
 * Walk content collections, find every <Aff slug="..."> usage and
 * every bare /<basePath>/<slug>/ href, cross-check against affiliates.
 *
 *   - unknownSlugs: referenced in content but missing from config
 *   - unusedSlugs:  defined in config but never referenced
 *
 * v0.1 implementation pending. The integration converts the result
 * into a thrown Error / logger.warn / no-op based on `mode`.
 */
export async function validateAffiliateUsage(
  _contentRoot: string,
  _basePath: string,
  _affiliates: AffiliatesMap,
): Promise<ValidationResult> {
  return { unknownSlugs: [], unusedSlugs: [] };
}

export function reportValidation(
  result: ValidationResult,
  mode: ValidateMode,
  logger: { info: (m: string) => void; warn: (m: string) => void },
): void {
  if (mode === 'off') return;
  const messages: string[] = [];
  for (const u of result.unknownSlugs) {
    messages.push(
      `unknown slug "${u.slug}" referenced in ${u.file}${u.line ? `:${u.line}` : ''}`,
    );
  }
  if (messages.length === 0) return;
  const joined = messages.map((m) => `  - ${m}`).join('\n');
  if (mode === 'strict') {
    throw new Error(`[astro-recommends] validation failed:\n${joined}`);
  }
  logger.warn(`[astro-recommends] validation:\n${joined}`);
}
