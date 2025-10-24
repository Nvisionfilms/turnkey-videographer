/**
 * Secure Storage Utility
 * Provides encrypted localStorage for sensitive data
 * Uses Web Crypto API for AES-GCM encryption
 */

/**
 * Generate a consistent encryption key from a passphrase
 * Uses PBKDF2 for key derivation
 */
async function deriveKey(passphrase, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-GCM
 */
async function encrypt(data, key) {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(data))
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Convert to base64 for storage
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt data using AES-GCM
 */
async function decrypt(encryptedData, key) {
  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

// Application-specific encryption key
// In production, this could be derived from user session or stored securely
const APP_KEY_PASSPHRASE = 'nvision-calculator-secure-storage-v1';
const APP_SALT = 'nvision-2025';

let cachedKey = null;

/**
 * Get or create the encryption key
 */
async function getEncryptionKey() {
  if (!cachedKey) {
    cachedKey = await deriveKey(APP_KEY_PASSPHRASE, APP_SALT);
  }
  return cachedKey;
}

/**
 * Set an item in secure storage (encrypted)
 */
export async function setSecureItem(key, value) {
  try {
    const encryptionKey = await getEncryptionKey();
    const encrypted = await encrypt(value, encryptionKey);
    localStorage.setItem(`secure_${key}`, encrypted);
    return true;
  } catch (error) {
    console.error('Failed to set secure item:', error);
    return false;
  }
}

/**
 * Get an item from secure storage (decrypted)
 */
export async function getSecureItem(key) {
  try {
    const encrypted = localStorage.getItem(`secure_${key}`);
    if (!encrypted) return null;

    const encryptionKey = await getEncryptionKey();
    return await decrypt(encrypted, encryptionKey);
  } catch (error) {
    console.error('Failed to get secure item:', error);
    return null;
  }
}

/**
 * Remove an item from secure storage
 */
export function removeSecureItem(key) {
  localStorage.removeItem(`secure_${key}`);
}

/**
 * Check if a secure item exists
 */
export function hasSecureItem(key) {
  return localStorage.getItem(`secure_${key}`) !== null;
}

/**
 * Clear all secure items
 */
export function clearSecureStorage() {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('secure_')) {
      localStorage.removeItem(key);
    }
  });
}

export default {
  setSecureItem,
  getSecureItem,
  removeSecureItem,
  hasSecureItem,
  clearSecureStorage
};
