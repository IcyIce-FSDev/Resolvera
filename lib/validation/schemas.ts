/**
 * Zod Validation Schemas for API Inputs
 * Re-exports from modular schema files
 */
import { z } from 'zod';

// Re-export all schemas from modular files
export { createUserSchema, loginSchema, updateUserSchema } from './schemas/user';
export { addZoneSchema } from './schemas/zone';
export { dnsRecordSchema } from './schemas/dns';
export { watcherSchema } from './schemas/watcher';

/**
 * Helper function to validate and return formatted errors
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Array<{ path: string; message: string }>;
} {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  // Format Zod errors into a more user-friendly format
  const errors = result.error.issues.map((err) => ({
    path: err.path.join('.'),
    message: err.message,
  }));

  return {
    success: false,
    errors,
  };
}
