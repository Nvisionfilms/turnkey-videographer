/**
 * Affiliate Code Generator
 * Generates unique, readable affiliate codes
 */

import crypto from 'crypto';

/**
 * Generate a secure random string
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
function generateSecureRandom(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous chars
  const bytes = crypto.randomBytes(length);
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

/**
 * Generate affiliate code from name
 * Format: FIRSTNAME + random 5 chars (e.g., JOHN2K9P7)
 * @param {string} name - Affiliate name
 * @returns {string} Affiliate code
 */
export function generateAffiliateCode(name) {
  // Extract first name and clean it
  const firstName = name.split(' ')[0]
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .substring(0, 8); // Max 8 chars from name
  
  // Generate random suffix (5 chars)
  const randomSuffix = generateSecureRandom(5);
  
  // Combine: name + random
  return `${firstName}${randomSuffix}`;
}

/**
 * Check if code is unique in database
 * @param {object} pool - Database pool
 * @param {string} code - Code to check
 * @returns {Promise<boolean>} True if unique
 */
export async function isCodeUnique(pool, code) {
  const result = await pool.query(
    'SELECT COUNT(*) FROM affiliates WHERE code = $1',
    [code]
  );
  return parseInt(result.rows[0].count) === 0;
}

/**
 * Generate unique affiliate code (retries if duplicate)
 * @param {object} pool - Database pool
 * @param {string} name - Affiliate name
 * @returns {Promise<string>} Unique affiliate code
 */
export async function generateUniqueAffiliateCode(pool, name) {
  let code;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    code = generateAffiliateCode(name);
    attempts++;
    
    if (attempts >= maxAttempts) {
      // Fallback: use longer random suffix
      code = `AFF${generateSecureRandom(8)}`;
    }
  } while (!(await isCodeUnique(pool, code)) && attempts < maxAttempts);
  
  return code;
}

export default {
  generateAffiliateCode,
  isCodeUnique,
  generateUniqueAffiliateCode
};
