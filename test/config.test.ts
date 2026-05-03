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
});
