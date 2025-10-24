/**
 * NVision Serial Code Service
 * Handles generation, validation, and activation of subscription unlock codes
 */

// Storage keys
const STORAGE_KEYS = {
  SUBSCRIPTION_CODE: 'nvision_subscription_code',
  SUBSCRIPTION_ACTIVATED: 'nvision_subscription_activated',
  SUBSCRIPTION_ACTIVATED_DATE: 'nvision_subscription_activated_date',
  SUBSCRIPTION_EMAIL: 'nvision_subscription_email'
};

/**
 * Generate a simple hash for code validation
 * In production, this would be replaced with a proper HMAC using a secret key
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
 * Generate a cryptographically secure random string
 * Uses crypto.getRandomValues() for true randomness
 */
function generateSecureRandomString(length = 4) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars (0,O,1,I)
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

/**
 * Generate a subscription unlock code
 * Format: NV-XXXX-XXXX-XXXX-XXXX
 * Uses cryptographically secure random generation
 */
export function generateSerialCode() {
  const part1 = generateSecureRandomString(4);
  const part2 = generateSecureRandomString(4);
  const part3 = generateSecureRandomString(4);
  
  const code = `NV-${part1}-${part2}-${part3}`;
  const checksum = simpleHash(code).substring(0, 4);
  
  return `${code}-${checksum}`;
}

/**
 * Validate the format of a serial code
 */
export function validateCodeFormat(code) {
  if (!code || typeof code !== 'string') {
    return false;
  }
  
  // Format: NV-XXXX-XXXX-XXXX-XXXX
  const pattern = /^NV-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(code.trim().toUpperCase());
}

/**
 * Verify the checksum of a serial code
 */
export function verifyCodeChecksum(code) {
  if (!validateCodeFormat(code)) {
    return false;
  }
  
  const parts = code.split('-');
  const baseCode = `NV-${parts[1]}-${parts[2]}-${parts[3]}`;
  const providedChecksum = parts[4];
  const calculatedChecksum = simpleHash(baseCode).substring(0, 4);
  
  return providedChecksum === calculatedChecksum;
}

/**
 * List of valid pre-generated codes for demo/testing
 * In production, these would be stored in a database and marked as used/unused
 */
const VALID_DEMO_CODES = [
  'NV-DEMO-TEST-CODE-A1B2',
  'NV-PROD-FULL-YEAR-C3D4',
  'NV-LIFE-TIME-UNLK-E5F6'
];

/**
 * Check if a code is in the valid demo codes list
 */
function isValidDemoCode(code) {
  return VALID_DEMO_CODES.includes(code.trim().toUpperCase());
}

/**
 * Activate a subscription code
 * @param {string} code - The unlock code to activate
 * @param {string} email - Optional email for tracking
 * @returns {Object} - Result object with success status and message
 */
export function activateSubscriptionCode(code, email = '') {
  const normalizedCode = code.trim().toUpperCase();
  
  // Check if already activated
  const existingCode = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_CODE);
  const isActivated = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_ACTIVATED) === 'true';
  
  if (isActivated && existingCode) {
    return {
      success: false,
      message: 'A subscription is already active on this device.',
      code: 'ALREADY_ACTIVATED'
    };
  }
  
  // Validate format
  if (!validateCodeFormat(normalizedCode)) {
    return {
      success: false,
      message: 'Invalid code format. Code should be in format: NV-XXXX-XXXX-XXXX-XXXX',
      code: 'INVALID_FORMAT'
    };
  }
  
  // Check if it's a valid demo code or verify checksum
  const isValid = isValidDemoCode(normalizedCode) || verifyCodeChecksum(normalizedCode);
  
  if (!isValid) {
    return {
      success: false,
      message: 'Invalid unlock code. Please check your code and try again.',
      code: 'INVALID_CODE'
    };
  }
  
  // Activate the subscription
  try {
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_CODE, normalizedCode);
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_ACTIVATED, 'true');
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_ACTIVATED_DATE, new Date().toISOString());
    
    if (email) {
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_EMAIL, email);
    }
    
    return {
      success: true,
      message: 'Subscription activated successfully! You now have unlimited access.',
      code: 'ACTIVATED'
    };
  } catch (error) {
    console.error('Error activating subscription:', error);
    return {
      success: false,
      message: 'Failed to activate subscription. Please try again.',
      code: 'ACTIVATION_ERROR'
    };
  }
}

/**
 * Check if a subscription is currently active
 */
export function isSubscriptionActive() {
  const isActivated = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_ACTIVATED) === 'true';
  const code = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_CODE);
  
  return isActivated && code !== null;
}

/**
 * Get subscription details
 */
export function getSubscriptionDetails() {
  if (!isSubscriptionActive()) {
    return null;
  }
  
  return {
    code: localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_CODE),
    activatedDate: localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_ACTIVATED_DATE),
    email: localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_EMAIL)
  };
}

/**
 * Deactivate subscription (for testing/admin purposes)
 */
export function deactivateSubscription() {
  localStorage.removeItem(STORAGE_KEYS.SUBSCRIPTION_CODE);
  localStorage.removeItem(STORAGE_KEYS.SUBSCRIPTION_ACTIVATED);
  localStorage.removeItem(STORAGE_KEYS.SUBSCRIPTION_ACTIVATED_DATE);
  localStorage.removeItem(STORAGE_KEYS.SUBSCRIPTION_EMAIL);
  
  return {
    success: true,
    message: 'Subscription deactivated.'
  };
}

/**
 * Generate multiple codes for distribution
 * This would typically be done server-side
 */
export function generateBatchCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(generateSerialCode());
  }
  return codes;
}

export default {
  generateSerialCode,
  validateCodeFormat,
  verifyCodeChecksum,
  activateSubscriptionCode,
  isSubscriptionActive,
  getSubscriptionDetails,
  deactivateSubscription,
  generateBatchCodes,
  STORAGE_KEYS
};
