/**
 * Watcher validation schemas
 */
import { z } from 'zod';

/**
 * Watcher record type validation (currently only A and AAAA supported)
 */
const watcherRecordTypeSchema = z.enum(['A', 'AAAA']);

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
 * Add/Update watcher schema
 */
export const watcherSchema = z.object({
  recordName: z.string()
    .min(1, 'Record name is required')
    .max(255, 'Record name is too long')
    .trim(),
  recordType: watcherRecordTypeSchema,
  zoneName: zoneNameSchema,
  enabled: z.boolean().optional().default(true),
});
