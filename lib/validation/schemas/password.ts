/**
 * Password validation schema
 */
import { z } from 'zod';

/**
 * Password validation matching our password strength requirements
 * - Minimum 12 characters
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one number
 * - At least one special character
 * - Must not contain common passwords
 */
export const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character')
  .refine((val) => {
    const commonPasswords = [
      'password', '12345678', 'qwerty', 'admin', 'letmein',
      'welcome', 'monkey', 'dragon', 'master', 'sunshine',
      'password123', 'admin123', 'welcome123'
    ];
    return !commonPasswords.some(common => val.toLowerCase().includes(common));
  }, 'Password contains a common word or pattern');
