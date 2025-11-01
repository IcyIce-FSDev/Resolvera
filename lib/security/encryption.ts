// AES-256-GCM encryption for sensitive data (API tokens)
// Uses ZONE_API_HASH_SECRET from environment variables

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment variable
 * Derives a 256-bit key from the secret using PBKDF2
 */
function getEncryptionKey(salt: Buffer): Buffer {
  const secret = process.env.ZONE_API_HASH_SECRET || process.env.ENCRYPTION_KEY || '';

  if (!secret) {
    throw new Error('ZONE_API_HASH_SECRET or ENCRYPTION_KEY must be set in environment variables');
  }

  // Derive key using PBKDF2
  return crypto.pbkdf2Sync(secret, salt, 100000, 32, 'sha256');
}

/**
 * Encrypt a string (e.g., API token)
 * Returns base64-encoded string in format: salt:iv:authTag:encryptedData
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty string');
  }

  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive key from secret + salt
  const key = getEncryptionKey(salt);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt the data
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  // Get authentication tag
  const authTag = cipher.getAuthTag();

  // Combine all parts: salt:iv:authTag:encryptedData
  const combined = [
    salt.toString('base64'),
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted
  ].join(':');

  return combined;
}

/**
 * Decrypt an encrypted string
 * Expects format: salt:iv:authTag:encryptedData
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error('Cannot decrypt empty string');
  }

  try {
    // Split the combined string
    const parts = encryptedData.split(':');

    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }

    const [saltB64, ivB64, authTagB64, encrypted] = parts;

    // Convert from base64
    const salt = Buffer.from(saltB64, 'base64');
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');

    // Derive key from secret + salt
    const key = getEncryptionKey(salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if a string is encrypted
 * Returns true if the string appears to be in encrypted format
 */
export function isEncrypted(data: string): boolean {
  if (!data) return false;

  // Check if it matches the encrypted format (4 base64 parts separated by colons)
  const parts = data.split(':');
  if (parts.length !== 4) return false;

  // Verify each part is valid base64
  try {
    parts.forEach(part => Buffer.from(part, 'base64'));
    return true;
  } catch {
    return false;
  }
}

/**
 * Encrypt API token if not already encrypted
 * Safe to call multiple times
 */
export function encryptIfNeeded(token: string): string {
  if (!token) return token;
  if (isEncrypted(token)) return token;
  return encrypt(token);
}

/**
 * Decrypt API token if encrypted, otherwise return as-is
 * Safe to call on both encrypted and plain tokens
 */
export function decryptIfNeeded(token: string): string {
  if (!token) return token;
  if (!isEncrypted(token)) return token;
  return decrypt(token);
}
