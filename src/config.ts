import { z } from 'zod';

/**
 * URL-safe slug pattern: lowercase letters, digits, hyphens; can't start or
 * end with a hyphen; can't be empty. Exported so the <Aff> component can
 * re-validate at render time (defence in depth — the config side already
 * enforces it, but author-supplied prop values come from a different trust
 * boundary).
 */
export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

/**
 * Single affiliate entry. The slug is the *key* in the parent map,
 * not a field — this keeps the file diff-friendly when reordering.
 *
 * `note` is purely for the author's own bookkeeping (commission rates,
 * expiry dates, renegotiation reminders) — it's never rendered, and only
 * surfaces in the config file diff history.
 *
 * The url field has two refinements beyond `z.string().url()`:
 *
 *   - http(s) only — `javascript:` / `data:` / `file:` / `vbscript:` are
 *     rejected. They wouldn't navigate from a Cloudflare/Netlify 302 in
 *     modern browsers, but defence in depth: a hostile config entry must
 *     not be able to plant ambiguous schemes in the redirects file.
 *
 *   - no CR/LF — without this, a config entry url containing a newline
 *     (e.g. `"https://ok.com\n/login /attacker.com 302"`) would smuggle
 *     additional rules into the generated `_redirects`, since the
 *     renderer interpolates the url directly. This is the highest-impact
 *     pre-release finding from the security audit.
 */
export const affiliateSchema = z
  .object({
    url: z
      .string()
      .url()
      .refine((u) => /^https?:\/\//i.test(u), {
        message: 'url must use http(s) scheme',
      })
      .refine((u) => !/[\r\n]/.test(u), {
        message: 'url must not contain CR or LF characters',
      }),
    label: z.string().optional(),
    note: z.string().optional(),
  })
  .strict();

export type Affiliate = z.infer<typeof affiliateSchema>;

export const affiliatesMapSchema = z.record(
  z.string().min(1).regex(SLUG_PATTERN, {
    message:
      'slug must be URL-safe: lowercase letters, digits, hyphens; not start/end with hyphen',
  }),
  affiliateSchema,
);

export type AffiliatesMap = z.infer<typeof affiliatesMapSchema>;

export const defaultsSchema = z
  .object({
    rel: z.array(z.string()).optional(),
    target: z.enum(['_blank', '_self', '_parent', '_top']).optional(),
  })
  .strict()
  .optional();

export type Defaults = z.infer<typeof defaultsSchema>;

export const targetSchema = z.enum(['cloudflare', 'netlify']);
export type Target = z.infer<typeof targetSchema>;

export const validateModeSchema = z.enum(['strict', 'warn', 'off']);
export type ValidateMode = z.infer<typeof validateModeSchema>;

export const integrationOptionsSchema = z
  .object({
    basePath: z
      .string()
      .regex(/^\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/i, {
        message: 'basePath must start with / and contain URL-safe segments',
      })
      .default('/recommends'),
    target: targetSchema,
    config: z.string().optional(),
    validate: validateModeSchema.default('strict'),
    defaults: defaultsSchema,
  })
  .strict();

export type IntegrationOptions = z.input<typeof integrationOptionsSchema>;
export type ResolvedIntegrationOptions = z.output<
  typeof integrationOptionsSchema
>;

/**
 * Identity helper for type inference. Consumers do:
 *
 *   export default defineAffiliates({ 'slug': { url: '...', ... } });
 *
 * Throws (with a clear, prefixed message) if the shape is invalid.
 */
export function defineAffiliates(map: AffiliatesMap): AffiliatesMap {
  const result = affiliatesMapSchema.safeParse(map);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`[astro-recommends] invalid affiliates config:\n${issues}`);
  }
  return result.data;
}
