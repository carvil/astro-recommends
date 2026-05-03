import { describe, expect, it } from 'vitest';
import { defineAffiliates, SLUG_PATTERN } from '../src/config.ts';
import {
  renderCloudflareRedirects,
  renderNetlifyRedirects,
} from '../src/targets/index.ts';
import { validateAffiliateUsage, AFF_RE } from '../src/validate.ts';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('security: URL scheme allow-list', () => {
  it.each([
    ['javascript:alert(1)'],
    ['JavaScript:alert(1)'],
    ['data:text/html,<script>alert(1)</script>'],
    ['file:///etc/passwd'],
    ['vbscript:msgbox(1)'],
    ['ftp://example.com/path'],
  ])('rejects %s', (url) => {
    expect(() =>
      defineAffiliates({
        bad: { url } as { url: string },
      }),
    ).toThrow(/http\(s\)/);
  });

  it('accepts http and https', () => {
    expect(() =>
      defineAffiliates({
        a: { url: 'http://example.com' },
        b: { url: 'https://example.com/path?q=1#frag' },
      }),
    ).not.toThrow();
  });
});

describe('security: URL CR/LF rejection (redirect-rule injection)', () => {
  it('rejects \\n in url', () => {
    expect(() =>
      defineAffiliates({
        bad: { url: 'https://ok.com\n/login /attacker.com 302' },
      }),
    ).toThrow(/CR or LF/);
  });

  it('rejects \\r in url', () => {
    expect(() =>
      defineAffiliates({
        bad: { url: 'https://ok.com\r\n/admin /attacker.com 302' },
      }),
    ).toThrow(/CR or LF/);
  });

  it('rejects \\r\\n in url', () => {
    expect(() =>
      defineAffiliates({
        bad: { url: 'https://ok.com\r/login /attacker.com 302' },
      }),
    ).toThrow(/CR or LF/);
  });

  it('renderers cannot smuggle extra rules — schema-clean URL produces a single line', () => {
    const map = {
      foo: { url: 'https://example.com/path?q=1', label: 'Foo' },
    };
    const cf = renderCloudflareRedirects('/go', map, undefined);
    const nl = renderNetlifyRedirects('/go', map, undefined);
    // Each entry should produce exactly one rule line beyond the header.
    expect(cf.split('\n').filter((l) => l.startsWith('/go/')).length).toBe(1);
    expect(nl.split('\n').filter((l) => l.startsWith('/go/')).length).toBe(1);
  });
});

describe('security: SLUG_PATTERN export', () => {
  it('matches valid URL-safe slugs', () => {
    expect(SLUG_PATTERN.test('deep-work')).toBe(true);
    expect(SLUG_PATTERN.test('a')).toBe(true);
    expect(SLUG_PATTERN.test('a1b2-c3')).toBe(true);
  });

  it('rejects path-traversal-style slugs', () => {
    expect(SLUG_PATTERN.test('../../evil')).toBe(false);
    expect(SLUG_PATTERN.test('foo?evil=1')).toBe(false);
    expect(SLUG_PATTERN.test('foo#evil')).toBe(false);
    expect(SLUG_PATTERN.test('foo bar')).toBe(false);
  });

  it('rejects prototype-pollution-style slugs', () => {
    expect(SLUG_PATTERN.test('__proto__')).toBe(false);
    expect(SLUG_PATTERN.test('constructor')).toBe(true); // alphanumeric — accepted
    // Slug 'constructor' is alphanumeric so allowed; the *value* shape is
    // schema-validated, so this can't poison Object.prototype anyway.
  });

  it('rejects leading/trailing hyphens', () => {
    expect(SLUG_PATTERN.test('-foo')).toBe(false);
    expect(SLUG_PATTERN.test('foo-')).toBe(false);
  });
});

describe('security: AFF_RE bounds matches within a single <Aff> tag', () => {
  it('does not span across decoy <Aff text in prose to a later real <Aff>', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'aff-validate-'));
    await mkdir(join(dir, 'posts'), { recursive: true });
    // A stray '<Aff' token (e.g. inside a code fence explaining the
    // component) followed eventually by a real <Aff slug="x">. Old regex
    // (the broad [\s\S]*?) would associate the slug with the decoy.
    const fixture = `
This post explains the \`<Aff\` component (note: just the opening
token in prose, not a real usage).

Some more body text here. And later, a real reference:

<Aff slug="real-slug">Real link</Aff>

End.
`;
    await writeFile(join(dir, 'posts', 'a.mdx'), fixture, 'utf8');
    const result = await validateAffiliateUsage(dir, '/go', {
      'real-slug': { url: 'https://example.com' },
    });
    // The only slug captured should be the real one — no false attribution
    // from the decoy token.
    expect(result.unknownSlugs).toEqual([]);
    expect(result.unusedSlugs).toEqual([]);
  });

  it('caps each match within a single tag — closing > stops the scan', () => {
    AFF_RE.lastIndex = 0;
    const text = '<Aff something>text<Aff slug="real">x</Aff>';
    const matches: string[] = [];
    let m;
    while ((m = AFF_RE.exec(text)) !== null) {
      matches.push(m[1]!);
    }
    // First <Aff> has no slug attribute; the regex's [^>]*? must NOT cross
    // the '>' to find slug= in the second tag. The only slug captured is
    // from the second, real tag.
    expect(matches).toEqual(['real']);
  });
});
