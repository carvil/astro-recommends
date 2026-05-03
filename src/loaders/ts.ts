import { createJiti } from 'jiti';
import { pathToFileURL } from 'node:url';

/**
 * Loads a TS/JS/MJS config via jiti — handles TypeScript, ESM, and CJS uniformly
 * without requiring a build step in the consumer's project.
 *
 * Returns the module's default export when present, otherwise the module itself.
 */
export async function loadTsConfig(filepath: string): Promise<unknown> {
  const jiti = createJiti(pathToFileURL(filepath).href, {
    interopDefault: true,
    moduleCache: false,
  });
  const mod = await jiti.import<{ default?: unknown } | unknown>(filepath);
  if (mod && typeof mod === 'object' && 'default' in mod) {
    return (mod as { default: unknown }).default ?? mod;
  }
  return mod;
}
