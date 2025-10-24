import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to codes database file (JSON file for simplicity - use real DB in production)
const CODES_DB_PATH = path.join(__dirname, '../data/codes.json');

/**
 * Generate HMAC hash of a code for secure storage
 */
function generateHMAC(code) {
  const secret = process.env.HMAC_SECRET_KEY;
  if (!secret) {
    throw new Error('HMAC_SECRET_KEY not configured');
  }
  return crypto.createHmac('sha256', secret).update(code).digest('hex');
}

/**
 * Generate a cryptographically secure random code
 */
export async function generateSecureCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const parts = [];
  
  for (let i = 0; i < 3; i++) {
    const bytes = crypto.randomBytes(4);
    let part = '';
    for (let j = 0; j < 4; j++) {
      part += chars[bytes[j] % chars.length];
    }
    parts.push(part);
  }
  
  const code = `NV-${parts.join('-')}`;
  
  // Generate checksum
  const checksum = generateSimpleHash(code).substring(0, 4);
  
  return `${code}-${checksum}`;
}

/**
 * Simple hash for checksum (same as client-side)
 */
function generateSimpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).toUpperCase();
}

/**
 * Initialize codes database file
 */
async function initDatabase() {
  try {
    await fs.access(CODES_DB_PATH);
  } catch {
    // File doesn't exist, create it
    const dataDir = path.dirname(CODES_DB_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(CODES_DB_PATH, JSON.stringify({ codes: [] }, null, 2));
  }
}

/**
 * Read codes from database
 */
async function readCodes() {
  await initDatabase();
  const data = await fs.readFile(CODES_DB_PATH, 'utf8');
  return JSON.parse(data);
}

/**
 * Write codes to database
 */
async function writeCodes(data) {
  await fs.writeFile(CODES_DB_PATH, JSON.stringify(data, null, 2));
}

/**
 * Store a new code in the database
 */
export async function storeCode(codeData) {
  const db = await readCodes();
  
  const codeRecord = {
    id: crypto.randomUUID(),
    codeHash: generateHMAC(codeData.code),
    email: codeData.email,
    customerName: codeData.customerName,
    amountPaid: codeData.amountPaid,
    stripeSessionId: codeData.stripeSessionId,
    stripeCustomerId: codeData.stripeCustomerId,
    status: codeData.status || 'issued',
    issuedAt: codeData.issuedAt || new Date().toISOString(),
    activatedAt: null,
    activatedByDeviceId: null,
    activationCount: 0
  };
  
  db.codes.push(codeRecord);
  await writeCodes(db);
  
  console.log(`💾 Code stored: ${codeRecord.id}`);
  return codeRecord;
}

/**
 * Validate a code (check format and existence)
 */
export async function validateCode(code) {
  // Validate format
  const pattern = /^NV-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  if (!pattern.test(code)) {
    return {
      success: false,
      message: 'Invalid code format',
      code: 'INVALID_FORMAT'
    };
  }
  
  // Verify checksum
  const parts = code.split('-');
  const baseCode = `NV-${parts[1]}-${parts[2]}-${parts[3]}`;
  const providedChecksum = parts[4];
  const calculatedChecksum = generateSimpleHash(baseCode).substring(0, 4);
  
  if (providedChecksum !== calculatedChecksum) {
    return {
      success: false,
      message: 'Invalid code checksum',
      code: 'INVALID_CHECKSUM'
    };
  }
  
  // Check if code exists in database
  const db = await readCodes();
  const codeHash = generateHMAC(code);
  const codeRecord = db.codes.find(c => c.codeHash === codeHash);
  
  if (!codeRecord) {
    return {
      success: false,
      message: 'Code not found',
      code: 'NOT_FOUND'
    };
  }
  
  // Check status
  if (codeRecord.status === 'revoked') {
    return {
      success: false,
      message: 'This code has been revoked',
      code: 'REVOKED'
    };
  }
  
  if (codeRecord.status === 'activated') {
    return {
      success: false,
      message: 'This code has already been activated',
      code: 'ALREADY_ACTIVATED',
      activatedAt: codeRecord.activatedAt
    };
  }
  
  return {
    success: true,
    message: 'Code is valid and ready to activate',
    code: 'VALID'
  };
}

/**
 * Activate a code
 */
export async function activateCode(code, email, deviceId) {
  // First validate the code
  const validation = await validateCode(code);
  
  if (!validation.success) {
    return validation;
  }
  
  // Find and update the code
  const db = await readCodes();
  const codeHash = generateHMAC(code);
  const codeIndex = db.codes.findIndex(c => c.codeHash === codeHash);
  
  if (codeIndex === -1) {
    return {
      success: false,
      message: 'Code not found',
      code: 'NOT_FOUND'
    };
  }
  
  // Update code status
  db.codes[codeIndex].status = 'activated';
  db.codes[codeIndex].activatedAt = new Date().toISOString();
  db.codes[codeIndex].activatedByDeviceId = deviceId;
  db.codes[codeIndex].activationCount += 1;
  
  if (email) {
    db.codes[codeIndex].activatedByEmail = email;
  }
  
  await writeCodes(db);
  
  console.log(`✅ Code activated: ${db.codes[codeIndex].id}`);
  
  return {
    success: true,
    message: 'Code activated successfully',
    code: 'ACTIVATED',
    activatedAt: db.codes[codeIndex].activatedAt
  };
}

/**
 * Get code status
 */
export async function getCodeStatus(code) {
  const db = await readCodes();
  const codeHash = generateHMAC(code);
  const codeRecord = db.codes.find(c => c.codeHash === codeHash);
  
  if (!codeRecord) {
    return {
      success: false,
      message: 'Code not found',
      code: 'NOT_FOUND'
    };
  }
  
  return {
    success: true,
    status: codeRecord.status,
    issuedAt: codeRecord.issuedAt,
    activatedAt: codeRecord.activatedAt,
    activationCount: codeRecord.activationCount
  };
}

/**
 * Revoke a code (admin function)
 */
export async function revokeCode(code) {
  const db = await readCodes();
  const codeHash = generateHMAC(code);
  const codeIndex = db.codes.findIndex(c => c.codeHash === codeHash);
  
  if (codeIndex === -1) {
    return {
      success: false,
      message: 'Code not found'
    };
  }
  
  db.codes[codeIndex].status = 'revoked';
  db.codes[codeIndex].revokedAt = new Date().toISOString();
  
  await writeCodes(db);
  
  return {
    success: true,
    message: 'Code revoked successfully'
  };
}

export default {
  generateSecureCode,
  storeCode,
  validateCode,
  activateCode,
  getCodeStatus,
  revokeCode
};
