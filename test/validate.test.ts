import { describe, expect, it, vi } from 'vitest';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  reportValidation,
  validateAffiliateUsage,
  type ValidationResult,
} from '../src/validate.ts';

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const CONTENT_ROOT = join(FIXTURES_DIR, 'content');

describe('validateAffiliateUsage — content scan', () => {
  it('detects unknown slugs referenced in <Aff> usages', async () => {
    const result = await validateAffiliateUsage(CONTENT_ROOT, '/go', {
      'deep-work': { url: 'https://example.com/dw' },
      'good-strategy-bad-strategy': { url: 'https://example.com/gs' },
    });
    expect(result.unknownSlugs.map((u) => u.slug)).toEqual(['ghost-slug']);
    expect(result.unusedSlugs).toEqual([]);
  });

  it('reports unused slugs (defined but never referenced)', async () => {
    const result = await validateAffiliateUsage(CONTENT_ROOT, '/go', {
      'deep-work': { url: 'https://example.com/dw' },
      'good-strategy-bad-strategy': { url: 'https://example.com/gs' },
      'never-cited': { url: 'https://example.com/nc' },
    });
    expect(result.unusedSlugs).toEqual(['never-cited']);
    expect(result.unknownSlugs.map((u) => u.slug)).toEqual(['ghost-slug']);
  });

  it('returns empty arrays when content directory does not exist', async () => {
    const result = await validateAffiliateUsage(
      '/tmp/no-such-dir-' + Date.now(),
      '/go',
      { foo: { url: 'https://example.com/foo' } },
    );
    expect(result.unknownSlugs).toEqual([]);
    expect(result.unusedSlugs).toEqual(['foo']);
  });
});

describe('reportValidation — mode behaviour', () => {
  const sample: ValidationResult = {
    unknownSlugs: [{ slug: 'missing', file: 'posts/x.mdx' }],
    unusedSlugs: ['orphan'],
  };
  const logger = { info: vi.fn(), warn: vi.fn() };

  it('strict mode throws on unknown slugs', () => {
    expect(() => reportValidation(sample, 'strict', logger)).toThrow(
      /astro-recommends.*validation failed/s,
    );
  });

  it('warn mode logs a warning instead of throwing', () => {
    const log = { info: vi.fn(), warn: vi.fn() };
    reportValidation(sample, 'warn', log);
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('missing'));
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining('orphan'));
  });

  it('off mode is silent and never throws', () => {
    const log = { info: vi.fn(), warn: vi.fn() };
    reportValidation(sample, 'off', log);
    expect(log.warn).not.toHaveBeenCalled();
    expect(log.info).not.toHaveBeenCalled();
  });
});
