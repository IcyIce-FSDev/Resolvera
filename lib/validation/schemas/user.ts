/**
 * User validation schemas
 */
import { z } from 'zod';
import { emailSchema } from './email';
import { passwordSchema } from './password';

/**
 * User role validation
 */
const userRoleSchema = z.enum(['admin', 'user']);

/**
 * User creation schema (setup and admin/users)
 */
export const createUserSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long')
    .trim(),
  email: emailSchema,
  password: passwordSchema,
  role: userRoleSchema.optional(),
  assignedZoneIds: z.array(z.string()).optional(),
});

/**
 * Login schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * User update schema (for profile updates)
 */
export const updateUserSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long')
    .trim()
    .optional(),
  email: emailSchema.optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: passwordSchema.optional(),
  role: userRoleSchema.optional(),
  assignedZoneIds: z.array(z.string()).optional(),
}).refine((data) => {
  // If newPassword is provided, currentPassword must also be provided
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: 'Current password is required when changing password',
  path: ['currentPassword'],
});
