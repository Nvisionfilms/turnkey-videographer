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
 * Demo codes removed from client-side for security
 * All code validation should be done server-side in production
 * For testing, use the trial code "TRIAL3DAY" or generate codes server-side
 */

/**
 * Activate a subscription code
 * @param {string} code - The unlock code to activate
 * @param {string} email - Email for tracking/verification
 * @returns {Object} - Result object with success status and message
 */
export async function activateSubscriptionCode(code, email = '') {
  const normalizedCode = code.trim().toUpperCase();
  
  // Check if already activated on this device
  const existingCode = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_CODE);
  const isActivated = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_ACTIVATED) === 'true';
  
  if (isActivated && existingCode) {
    return {
      success: false,
      message: 'A subscription is already active on this device.',
      code: 'ALREADY_ACTIVATED'
    };
  }
  
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backend-backend-c520.up.railway.app';
  
  // First, try to verify if this is an existing subscription (for multi-device use)
  if (email) {
    try {
      const statusResponse = await fetch(`${API_BASE_URL}/api/unlock/status/${encodeURIComponent(email)}`);
      const statusData = await statusResponse.json();
      
      if (statusResponse.ok && statusData.isActive && statusData.unlockCode === normalizedCode) {
        // Existing valid subscription - activate locally
        localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_CODE, normalizedCode);
        localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_ACTIVATED, 'true');
        localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_ACTIVATED_DATE, new Date().toISOString());
        localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_EMAIL, email);
        
        return {
          success: true,
          message: 'Recording enabled. Subscription verified.',
          code: 'VERIFIED'
        };
      }
    } catch (e) {
      // Status check failed, continue to try activation
      console.log('Status check failed, trying activation:', e);
    }
  }
  
  // Try to activate as new code
  try {
    const userEmail = email || `device_${Date.now()}@local`;
    const response = await fetch(`${API_BASE_URL}/api/unlock/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: normalizedCode, email: userEmail })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      // Store activation locally
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_CODE, normalizedCode);
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_ACTIVATED, 'true');
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_ACTIVATED_DATE, new Date().toISOString());
      
      if (email) {
        localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_EMAIL, email);
      }
      
      return {
        success: true,
        message: 'Recording enabled. Your pricing decisions will now be stored.',
        code: 'ACTIVATED'
      };
    } else {
      // Check if code was already used - might be trying to use on another device
      if (data.error && data.error.includes('already been used')) {
        return {
          success: false,
          message: 'This code is registered to a different email. Enter the email used during purchase.',
          code: 'CODE_USED'
        };
      }
      return {
        success: false,
        message: data.error || data.message || 'Invalid access code.',
        code: 'INVALID_CODE'
      };
    }
  } catch (error) {
    console.error('Error activating subscription:', error);
    return {
      success: false,
      message: 'Unable to verify code. Check your connection and try again.',
      code: 'NETWORK_ERROR'
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
