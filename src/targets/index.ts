import type {
  AffiliatesMap,
  ResolvedIntegrationOptions,
  Target,
} from '../config.ts';
import { renderCloudflareRedirects } from './cloudflare.ts';
import { renderNetlifyRedirects } from './netlify.ts';

/**
 * Render redirect-file content for the given target.
 * The integration writes the returned string to the appropriate
 * location in dist/ (target-specific filename + path).
 */
export function renderRedirects(
  target: Target,
  basePath: string,
  affiliates: AffiliatesMap,
  defaults: ResolvedIntegrationOptions['defaults'],
): { filename: string; content: string } {
  switch (target) {
    case 'cloudflare':
      return {
        filename: '_redirects',
        content: renderCloudflareRedirects(basePath, affiliates, defaults),
      };
    case 'netlify':
      return {
        filename: '_redirects',
        content: renderNetlifyRedirects(basePath, affiliates, defaults),
      };
  }
}

export { renderCloudflareRedirects, renderNetlifyRedirects };
