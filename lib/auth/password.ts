// Password hashing and verification utilities
// Uses bcrypt for secure password hashing

import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12; // 12 rounds for strong security

/**
 * Hash a password for storage using bcrypt
 * Returns bcrypt hash format: $2b$12$...
 */
export async function hashPassword(password: string): Promise<string> {
  // Get secret from environment (server-side only) - used as pepper
  const secret = process.env.PASSWORD_HASH_SECRET;

  if (!secret) {
    throw new Error('PASSWORD_HASH_SECRET must be set in environment variables');
  }

  if (secret.length < 32) {
    throw new Error('PASSWORD_HASH_SECRET must be at least 32 characters long');
  }

  // Combine password with secret (pepper) for additional security
  const combined = password + secret;

  // Hash with bcrypt
  const hash = await bcrypt.hash(combined, BCRYPT_ROUNDS);

  return hash;
}

/**
 * Verify a password against a stored hash
 * Supports both old PBKDF2 (salt$hash) and new bcrypt ($2b$...) formats for migration
 * Returns object with verification result and migration flag
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<{ valid: boolean; needsMigration: boolean }> {
  // Get secret from environment (server-side only) - used as pepper
  const secret = process.env.PASSWORD_HASH_SECRET;

  if (!secret) {
    throw new Error('PASSWORD_HASH_SECRET must be set in environment variables');
  }

  if (secret.length < 32) {
    throw new Error('PASSWORD_HASH_SECRET must be at least 32 characters long');
  }

  // Combine password with secret (pepper)
  const combined = password + secret;

  // Check if this is a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    // New bcrypt format - verify directly
    try {
      const isValid = await bcrypt.compare(combined, storedHash);
      return { valid: isValid, needsMigration: false };
    } catch (error) {
      console.error('Error verifying bcrypt password:', error);
      return { valid: false, needsMigration: false };
    }
  }

  // Old PBKDF2 format (salt$hash) - verify and mark for migration
  const [salt, hash] = storedHash.split('$');

  if (!salt || !hash) {
    return { valid: false, needsMigration: false };
  }

  try {
    // Verify using PBKDF2 (legacy)
    const crypto = require('crypto');
    const derivedKey = await new Promise<Buffer>((resolve, reject) => {
      crypto.pbkdf2(combined, '', 100000, 64, 'sha256', (err: Error, key: Buffer) => {
        if (err) reject(err);
        else resolve(key);
      });
    });

    const computedHash = derivedKey.toString('hex');
    const isValid = timingSafeEqual(hash, computedHash);

    // If valid, needs migration to bcrypt
    return { valid: isValid, needsMigration: isValid };
  } catch (error) {
    console.error('Error verifying PBKDF2 password:', error);
    return { valid: false, needsMigration: false };
  }
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Validate password strength
 * Enforces strong password requirements for production security
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Minimum length: 12 characters (industry best practice)
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  // Require lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Require uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Require number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Require special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)');
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password', '12345678', 'qwerty', 'admin', 'letmein',
    'welcome', 'monkey', 'dragon', 'master', 'sunshine',
    'password123', 'admin123', 'welcome123'
  ];

  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Password contains a common word or pattern - please choose a stronger password');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a temporary password
 */
export function generateTemporaryPassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*';

  const allChars = lowercase + uppercase + numbers + special;

  let password = '';

  // Ensure at least one of each type
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
