/**
 * NVision Unlock Code Generator (Backend)
 * Generates secure unlock codes in format: NV-XXXX-XXXX-XXXX-XXXX
 */

import crypto from 'crypto';

/**
 * Generate a cryptographically secure random string
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
function generateSecureRandomString(length = 4) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous chars (0,O,1,I)
  const bytes = crypto.randomBytes(length);
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

/**
 * Generate a simple hash for code validation
 * @param {string} str - String to hash
 * @returns {string} Hash string
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).toUpperCase();
}

/**
 * Generate a single unlock code
 * Format: NV-XXXX-XXXX-XXXX-XXXX
 * @returns {string} Unlock code
 */
export function generateUnlockCode() {
  const part1 = generateSecureRandomString(4);
  const part2 = generateSecureRandomString(4);
  const part3 = generateSecureRandomString(4);
  
  // Generate checksum from first 3 parts
  const dataToHash = `${part1}${part2}${part3}`;
  const checksum = simpleHash(dataToHash).substring(0, 4);
  
  return `NV-${part1}-${part2}-${part3}-${checksum}`;
}

/**
 * Generate multiple unlock codes
 * @param {number} count - Number of codes to generate
 * @returns {Array<string>} Array of unlock codes
 */
export function generateBatchCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(generateUnlockCode());
  }
  return codes;
}

/**
 * Validate unlock code format
 * @param {string} code - Code to validate
 * @returns {boolean} True if format is valid
 */
export function validateCodeFormat(code) {
  const pattern = /^NV-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;
  return pattern.test(code);
}

/**
 * Verify code checksum
 * @param {string} code - Code to verify
 * @returns {boolean} True if checksum is valid
 */
export function verifyCodeChecksum(code) {
  if (!validateCodeFormat(code)) return false;
  
  const parts = code.split('-');
  const dataToHash = `${parts[1]}${parts[2]}${parts[3]}`;
  const expectedChecksum = simpleHash(dataToHash).substring(0, 4);
  
  return parts[4] === expectedChecksum;
}

/**
 * Check if code is unique in database
 * @param {object} pool - Database pool
 * @param {string} code - Code to check
 * @returns {Promise<boolean>} True if unique
 */
export async function isCodeUnique(pool, code) {
  const result = await pool.query(
    'SELECT COUNT(*) FROM unlock_codes WHERE code = $1',
    [code]
  );
  return parseInt(result.rows[0].count) === 0;
}

/**
 * Generate unique unlock code (retries if duplicate)
 * @param {object} pool - Database pool
 * @returns {Promise<string>} Unique unlock code
 */
export async function generateUniqueUnlockCode(pool) {
  let code;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    code = generateUnlockCode();
    attempts++;
  } while (!(await isCodeUnique(pool, code)) && attempts < maxAttempts);
  
  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique code after maximum attempts');
  }
  
  return code;
}

/**
 * Generate and insert batch of codes into database
 * @param {object} pool - Database pool
 * @param {number} count - Number of codes to generate
 * @returns {Promise<Array<string>>} Array of generated codes
 */
export async function generateAndInsertBatch(pool, count = 100) {
  const codes = [];
  
  for (let i = 0; i < count; i++) {
    const code = await generateUniqueUnlockCode(pool);
    
    await pool.query(
      'INSERT INTO unlock_codes (code, status) VALUES ($1, $2)',
      [code, 'available']
    );
    
    codes.push(code);
  }
  
  return codes;
}

export default {
  generateUnlockCode,
  generateBatchCodes,
  validateCodeFormat,
  verifyCodeChecksum,
  isCodeUnique,
  generateUniqueUnlockCode,
  generateAndInsertBatch
};
