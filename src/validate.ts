import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type { AffiliatesMap, ValidateMode } from './config.ts';

export interface ValidationResult {
  unknownSlugs: { slug: string; file: string }[];
  unusedSlugs: string[];
}

const AFF_RE = /<Aff[\s\S]*?\bslug=["']([^"']+)["']/g;
const CONTENT_EXTS = /\.(md|mdx)$/;

async function walkContent(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const out: string[] = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walkContent(full)));
    } else if (CONTENT_EXTS.test(e.name)) {
      out.push(full);
    }
  }
  return out;
}

export async function validateAffiliateUsage(
  contentRoot: string,
  _basePath: string,
  affiliates: AffiliatesMap,
): Promise<ValidationResult> {
  const files = await walkContent(contentRoot);
  const used = new Set<string>();
  const unknown: { slug: string; file: string }[] = [];

  for (const file of files) {
    const text = await readFile(file, 'utf8');
    AFF_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = AFF_RE.exec(text)) !== null) {
      const slug = match[1];
      if (slug === undefined) continue;
      used.add(slug);
      if (!(slug in affiliates)) {
        unknown.push({ slug, file: relative(process.cwd(), file) });
      }
    }
  }

  const unusedSlugs = Object.keys(affiliates).filter((s) => !used.has(s));

  return { unknownSlugs: unknown, unusedSlugs };
}

export function reportValidation(
  result: ValidationResult,
  mode: ValidateMode,
  logger: { info: (m: string) => void; warn: (m: string) => void },
): void {
  if (mode === 'off') return;

  const errs: string[] = [];
  for (const u of result.unknownSlugs) {
    errs.push(`unknown slug "${u.slug}" referenced in ${u.file}`);
  }

  if (errs.length > 0) {
    const joined = errs.map((m) => `  - ${m}`).join('\n');
    if (mode === 'strict') {
      throw new Error(`[astro-recommends] validation failed:\n${joined}`);
    }
    logger.warn(`[astro-recommends] validation:\n${joined}`);
  }

  if (result.unusedSlugs.length > 0) {
    const list = result.unusedSlugs.map((s) => `  - ${s}`).join('\n');
    logger.info(
      `[astro-recommends] ${result.unusedSlugs.length} affiliate(s) defined but not referenced in content:\n${list}`,
    );
  }
}
