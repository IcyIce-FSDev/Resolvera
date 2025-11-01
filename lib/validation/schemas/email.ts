/**
 * Email validation schema
 */
import { z } from 'zod';

/**
 * List of known disposable email domains to block
 * This prevents abuse from temporary/throwaway email services
 */
const disposableEmailDomains = [
  // Popular disposable email services
  '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'tempmail.com',
  'throwaway.email', 'temp-mail.org', 'fakeinbox.com', 'maildrop.cc',
  'getnada.com', 'trashmail.com', 'yopmail.com', 'mohmal.com',
  'sharklasers.com', 'mailnesia.com', 'mintemail.com', 'mytrashmail.com',
  '33mail.com', 'dispostable.com', 'emailondeck.com', 'guerrillamailblock.com',
  'spam4.me', 'tmpeml.info', 'mailcatch.com', 'eatmymail.com',
  'spamgourmet.com', 'mailtemporaire.fr', 'throwawaymail.com', 'getairmail.com',
  'fakemail.net', 'trash-mail.com', 'anonymbox.com', 'deadaddress.com',
  'MailDrop.cc', 'Mailinator.com', 'TempMail.com', // Case variations
  // Add more as needed
];

/**
 * Email validation with disposable domain blocking
 */
export const emailSchema = z.string()
  .email('Invalid email format')
  .toLowerCase()
  .trim()
  .max(255, 'Email is too long')
  .refine((email) => {
    // Extract domain from email
    const domain = email.split('@')[1];
    if (!domain) return false;

    // Check if domain is in the disposable list (case-insensitive)
    return !disposableEmailDomains.some(
      disposable => disposable.toLowerCase() === domain.toLowerCase()
    );
  }, 'Disposable email addresses are not allowed');
