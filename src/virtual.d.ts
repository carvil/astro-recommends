/**
 * Type declarations for the virtual module injected by the integration.
 * Consumers reference this via:
 *
 *   /// <reference types="astro-recommends/virtual" />
 *
 * Or by adding it to their tsconfig#types. The .astro component imports
 * this module; it's available at build time once the integration runs.
 */
declare module 'astro-recommends:resolved' {
  export interface ResolvedRuntime {
    basePath: string;
    defaults: {
      rel?: string[];
      target?: '_blank' | '_self' | '_parent' | '_top';
    };
  }
  export const resolved: ResolvedRuntime;
  export default resolved;
}
