/**
 * Device Fingerprinting Utility
 * Creates a unique identifier for the user's device/browser
 */

/**
 * Generate a device fingerprint based on browser characteristics
 * This creates a reasonably unique ID without being invasive
 */
export async function generateDeviceFingerprint() {
  const components = [];

  // Screen resolution
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Language
  components.push(navigator.language);

  // Platform
  components.push(navigator.platform);

  // User agent (simplified)
  components.push(navigator.userAgent);

  // Hardware concurrency (CPU cores)
  components.push(navigator.hardwareConcurrency || 'unknown');

  // Device memory (if available)
  components.push(navigator.deviceMemory || 'unknown');

  // Canvas fingerprint (lightweight)
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('NVision', 2, 2);
  components.push(canvas.toDataURL().slice(-50)); // Last 50 chars

  // Combine all components
  const fingerprint = components.join('|');

  // Hash the fingerprint
  const hash = await simpleHash(fingerprint);

  return hash;
}

/**
 * Simple hash function using SubtleCrypto
 */
async function simpleHash(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Get or create device ID
 * Stores in localStorage for consistency
 */
export async function getDeviceId() {
  const STORAGE_KEY = 'nvision_device_id';
  
  // Check if we already have a device ID
  let deviceId = localStorage.getItem(STORAGE_KEY);
  
  if (!deviceId) {
    // Generate new device fingerprint
    deviceId = await generateDeviceFingerprint();
    localStorage.setItem(STORAGE_KEY, deviceId);
  }
  
  return deviceId;
}

/**
 * Get a short device identifier for display
 */
export async function getShortDeviceId() {
  const deviceId = await getDeviceId();
  return deviceId.substring(0, 8);
}

export default {
  generateDeviceFingerprint,
  getDeviceId,
  getShortDeviceId
};
