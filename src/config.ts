import { z } from 'zod';

/**
 * Single affiliate entry. The slug is the *key* in the parent map,
 * not a field — this keeps the file diff-friendly when reordering.
 */
export const affiliateSchema = z
  .object({
    url: z.string().url(),
    label: z.string().optional(),
    rel: z.array(z.string()).optional(),
    target: z.enum(['_blank', '_self', '_parent', '_top']).optional(),
    nofollow: z.boolean().optional(),
    sponsored: z.boolean().optional(),
    note: z.string().optional(),
  })
  .strict();

export type Affiliate = z.infer<typeof affiliateSchema>;

export const affiliatesMapSchema = z.record(
  z
    .string()
    .min(1)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i, {
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
    nofollow: z.boolean().optional(),
    sponsored: z.boolean().optional(),
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
