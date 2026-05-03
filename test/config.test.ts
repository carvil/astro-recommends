import { describe, expect, it } from 'vitest';
import { defineAffiliates } from '../src/config.ts';

describe('defineAffiliates', () => {
  it('accepts a valid map', () => {
    const result = defineAffiliates({
      'deep-work': {
        url: 'https://www.amazon.com/dp/1455586692?tag=test-20',
        label: 'Deep Work',
      },
    });
    expect(result['deep-work']?.url).toContain('amazon.com');
  });

  it('rejects an invalid URL', () => {
    expect(() =>
      defineAffiliates({
        bad: { url: 'not a url' },
      }),
    ).toThrow(/astro-recommends/);
  });

  it('rejects a slug with invalid characters', () => {
    expect(() =>
      defineAffiliates({
        'has space': { url: 'https://example.com' },
      }),
    ).toThrow(/astro-recommends/);
  });

  it('rejects unknown fields (strict)', () => {
    expect(() =>
      defineAffiliates({
        // @ts-expect-error -- intentional unknown field
        slug: { url: 'https://example.com', extra: true },
      }),
    ).toThrow(/astro-recommends/);
  });

  it('accepts the trimmed v0.1 shape: url, optional label, optional note', () => {
    const result = defineAffiliates({
      foo: {
        url: 'https://example.com/foo',
        label: 'Foo',
        note: '15% commission, expires 2027-01-01',
      },
      'bare-slug': {
        url: 'https://example.com/bar',
      },
    });
    expect(result.foo?.note).toContain('15%');
    expect(result['bare-slug']?.label).toBeUndefined();
  });

  it('rejects per-entry rel/target overrides (use <Aff> props instead, v0.1)', () => {
    expect(() =>
      defineAffiliates({
        // @ts-expect-error -- per-entry rel/target are not in v0.1 schema
        slug: { url: 'https://example.com', rel: ['nofollow'], target: '_blank' },
      }),
    ).toThrow(/astro-recommends/);
  });
});
