// Barrel for the components subpath export.
// Astro consumers do:  import { Aff } from 'astro-recommends/components';
//
// .astro modules are resolved by the consumer's Astro pipeline;
// TS doesn't natively understand them, hence the suppression.
// @ts-expect-error -- .astro module resolved by Astro at consumer build time
export { default as Aff } from './components/Aff.astro';
