/**
 * DNS record validation schemas
 */
import { z } from 'zod';

/**
 * DNS record types
 */
const dnsRecordTypeSchema = z.enum([
  'A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA', 'PTR'
]);

/**
 * DNS record name validation
 */
const dnsRecordNameSchema = z.string()
  .min(1, 'Record name is required')
  .max(255, 'Record name is too long')
  .trim();

/**
 * DNS record content validation (depends on type, but general validation here)
 */
const dnsRecordContentSchema = z.string()
  .min(1, 'Record content is required')
  .max(2048, 'Record content is too long')
  .trim();

/**
 * TTL validation (1 = auto, or 60-86400)
 */
const ttlSchema = z.union([
  z.literal(1), // Auto
  z.number().int().min(60).max(86400)
]);

/**
 * Cloudflare Zone ID validation (32 hex characters)
 */
const zoneIdSchema = z.string()
  .length(32, 'Zone ID must be 32 characters')
  .regex(/^[a-f0-9]{32}$/, 'Invalid Zone ID format (must be 32 hex characters)');

/**
 * Add/Update DNS record schema
 */
export const dnsRecordSchema = z.object({
  type: dnsRecordTypeSchema,
  name: dnsRecordNameSchema,
  content: dnsRecordContentSchema,
  ttl: ttlSchema.optional().default(1),
  proxied: z.boolean().optional().default(false),
  zoneId: zoneIdSchema.optional(), // Optional for updates
  comment: z.string().max(500).optional(),
});
