import type { AstroIntegration } from 'astro';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  integrationOptionsSchema,
  type AffiliatesMap,
  type IntegrationOptions,
  type ResolvedIntegrationOptions,
} from './config.ts';
import { loadAffiliatesConfig } from './loaders/index.ts';
import { renderRedirects } from './targets/index.ts';
import { reportValidation, validateAffiliateUsage } from './validate.ts';

const VIRTUAL_ID = 'astro-recommends:resolved';
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID;

export default function recommends(options: IntegrationOptions): AstroIntegration {
  const parsed = integrationOptionsSchema.safeParse(options);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`[astro-recommends] invalid integration options:\n${issues}`);
  }
  const opts: ResolvedIntegrationOptions = parsed.data;

  let affiliates: AffiliatesMap = {};
  let projectRoot = '';

  return {
    name: 'astro-recommends',
    hooks: {
      'astro:config:setup': async ({ config, logger, updateConfig }) => {
        projectRoot = fileURLToPath(config.root);

        const loaded = await loadAffiliatesConfig(projectRoot, opts.config);
        affiliates = loaded.map;
        logger.info(
          `loaded ${Object.keys(affiliates).length} affiliate(s) from ${loaded.path}`,
        );

        const virtualPayload = {
          basePath: opts.basePath,
          defaults: opts.defaults ?? {},
        };
        const virtualSource =
          `export const resolved = ${JSON.stringify(virtualPayload)};\n` +
          `export default resolved;\n`;

        updateConfig({
          vite: {
            plugins: [
              {
                name: 'astro-recommends:virtual',
                resolveId(id: string) {
                  if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
                  return null;
                },
                load(id: string) {
                  if (id === RESOLVED_VIRTUAL_ID) return virtualSource;
                  return null;
                },
              },
            ],
          },
        });
      },

      'astro:build:setup': async ({ logger }) => {
        if (opts.validate === 'off') return;
        const result = await validateAffiliateUsage(
          join(projectRoot, 'src', 'content'),
          opts.basePath,
          affiliates,
        );
        reportValidation(result, opts.validate, logger);
      },

      'astro:build:done': async ({ dir, logger }) => {
        const { filename, content } = renderRedirects(
          opts.target,
          opts.basePath,
          affiliates,
          opts.defaults,
        );
        const outDir = fileURLToPath(dir);
        const outPath = join(outDir, filename);
        await writeFile(outPath, content, 'utf8');
        logger.info(
          `wrote ${Object.keys(affiliates).length} redirect(s) → ${filename}`,
        );
      },
    },
  };
}
