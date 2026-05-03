import { readFile } from 'node:fs/promises';

/**
 * Strip JSONC comments (// line, /* block * /) so JSON.parse can handle them.
 * Conservative — won't touch comment-like sequences inside strings.
 */
function stripJsoncComments(text: string): string {
  let out = '';
  let i = 0;
  let inString = false;
  let stringQuote = '';
  while (i < text.length) {
    const c = text[i];
    const next = text[i + 1];
    if (inString) {
      out += c;
      if (c === '\\' && i + 1 < text.length) {
        out += text[i + 1];
        i += 2;
        continue;
      }
      if (c === stringQuote) inString = false;
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      inString = true;
      stringQuote = c;
      out += c;
      i++;
      continue;
    }
    if (c === '/' && next === '/') {
      while (i < text.length && text[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && next === '*') {
      i += 2;
      while (i < text.length - 1 && !(text[i] === '*' && text[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

export async function loadJsonConfig(filepath: string): Promise<unknown> {
  const text = await readFile(filepath, 'utf8');
  const stripped = filepath.endsWith('.jsonc') ? stripJsoncComments(text) : text;
  try {
    return JSON.parse(stripped);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`[astro-recommends] failed to parse ${filepath}: ${msg}`);
  }
}
