/**
 * Zone validation schemas
 */
import { z } from 'zod';

/**
 * Zone name validation (DNS zone format)
 */
const zoneNameSchema = z.string()
  .min(1, 'Zone name is required')
  .max(253, 'Zone name is too long')
  .regex(
    /^([a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i,
    'Invalid zone name format (e.g., example.com)'
  )
  .toLowerCase()
  .trim();

/**
 * Cloudflare Zone ID validation (32 hex characters)
 */
const zoneIdSchema = z.string()
  .length(32, 'Zone ID must be 32 characters')
  .regex(/^[a-f0-9]{32}$/, 'Invalid Zone ID format (must be 32 hex characters)');

/**
 * Cloudflare API Token validation
 */
const apiTokenSchema = z.string()
  .min(40, 'API token is too short')
  .max(500, 'API token is too long')
  .trim();

/**
 * Add zone schema
 */
export const addZoneSchema = z.object({
  zoneName: zoneNameSchema,
  zoneId: zoneIdSchema,
  apiToken: apiTokenSchema,
});
