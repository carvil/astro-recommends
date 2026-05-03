import type { AstroIntegration } from 'astro';
import {
  integrationOptionsSchema,
  type IntegrationOptions,
  type ResolvedIntegrationOptions,
} from './config.ts';

/**
 * Astro integration entry. Default export of the package.
 *
 * v0.1 plan (TODO):
 *   - astro:config:setup    — register injected config (resolve options, find config file)
 *   - astro:config:done     — load + validate affiliates config (zod)
 *   - astro:build:setup     — run validation pass over content collections
 *   - astro:build:generated — write _redirects to dist/ for the chosen target
 *
 * Until those hooks are implemented this is a no-op that simply
 * round-trips the options through the schema so config errors
 * surface during dev.
 */
export default function recommends(options: IntegrationOptions): AstroIntegration {
  const parsed = integrationOptionsSchema.safeParse(options);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`[astro-recommends] invalid integration options:\n${issues}`);
  }
  const resolved: ResolvedIntegrationOptions = parsed.data;

  return {
    name: 'astro-recommends',
    hooks: {
      'astro:config:setup': ({ logger }) => {
        logger.info(
          `basePath=${resolved.basePath} target=${resolved.target} validate=${resolved.validate} (no-op stub — implementation pending)`,
        );
      },
    },
  };
}
