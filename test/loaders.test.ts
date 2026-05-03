import { describe, expect, it } from 'vitest';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAffiliatesConfig, SEARCH_ORDER } from '../src/loaders/index.ts';

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

describe('loadAffiliatesConfig — explicit paths', () => {
  it('loads a TypeScript config (default export)', async () => {
    const { path, map } = await loadAffiliatesConfig(
      FIXTURES_DIR,
      'valid.config.ts',
    );
    expect(path).toContain('valid.config.ts');
    expect(map['deep-work']?.url).toContain('1455586692');
    expect(map['good-strategy-bad-strategy']?.label).toBe('Good Strategy Bad Strategy');
  });

  it('loads a JSON config', async () => {
    const { map } = await loadAffiliatesConfig(FIXTURES_DIR, 'valid.config.json');
    expect(Object.keys(map)).toHaveLength(2);
    expect(map['deep-work']?.label).toBe('Deep Work');
  });

  it('loads a JSONC config (strips comments)', async () => {
    const { map } = await loadAffiliatesConfig(FIXTURES_DIR, 'valid.config.jsonc');
    expect(map['deep-work']?.url).toContain('1455586692');
  });

  it('loads a YAML config', async () => {
    const { map } = await loadAffiliatesConfig(FIXTURES_DIR, 'valid.config.yaml');
    expect(Object.keys(map)).toHaveLength(2);
    expect(map['good-strategy-bad-strategy']?.url).toContain('0307886239');
  });

  it('rejects an invalid shape with a prefixed error', async () => {
    await expect(
      loadAffiliatesConfig(FIXTURES_DIR, 'invalid-shape.json'),
    ).rejects.toThrow(/astro-recommends.*invalid affiliates config/s);
  });

  it('throws when the explicit path does not exist', async () => {
    await expect(
      loadAffiliatesConfig(FIXTURES_DIR, 'no-such-file.json'),
    ).rejects.toThrow(/config not found at explicit path/);
  });
});

describe('loadAffiliatesConfig — auto-detection', () => {
  it('throws a clear error when no config is found', async () => {
    await expect(
      loadAffiliatesConfig('/tmp/astro-recommends-empty-' + Date.now()),
    ).rejects.toThrow(/no affiliates config found/);
  });

  it('search order includes all supported extensions', () => {
    expect(SEARCH_ORDER).toContain('affiliates.config.ts');
    expect(SEARCH_ORDER).toContain('affiliates.config.json');
    expect(SEARCH_ORDER).toContain('affiliates.config.yaml');
  });
});
