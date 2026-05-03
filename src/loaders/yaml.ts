import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';

export async function loadYamlConfig(filepath: string): Promise<unknown> {
  const text = await readFile(filepath, 'utf8');
  try {
    return parse(text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`[astro-recommends] failed to parse ${filepath}: ${msg}`);
  }
}
