import express from 'express';
import rateLimit from 'express-rate-limit';
import { validateCode, activateCode, getCodeStatus } from '../services/codeManager.js';

const router = express.Router();

// Parse JSON for API routes
router.use(express.json());

// Stricter rate limiting for code validation to prevent brute force
const codeValidationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Only 10 validation attempts per 15 minutes per IP
  message: {
    success: false,
    message: 'Too many validation attempts. Please try again in 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: false, // Count all requests
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Validate a code (check if it exists and is valid)
 * POST /api/codes/validate
 */
router.post('/validate', codeValidationLimiter, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Code is required'
      });
    }

    // Input length validation to prevent DoS
    if (typeof code !== 'string' || code.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid code format',
        code: 'INVALID_INPUT'
      });
    }

    const validation = await validateCode(code);

    res.json(validation);
  } catch (error) {
    console.error('Error validating code:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating code'
    });
  }
});

/**
 * Activate a code
 * POST /api/codes/activate
 */
router.post('/activate', codeValidationLimiter, async (req, res) => {
  try {
    const { code, email, deviceId } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Code is required'
      });
    }

    // Input length validation
    if (typeof code !== 'string' || code.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid code format',
        code: 'INVALID_INPUT'
      });
    }

    if (email && (typeof email !== 'string' || email.length > 255)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        code: 'INVALID_INPUT'
      });
    }

    if (deviceId && (typeof deviceId !== 'string' || deviceId.length > 255)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid device ID format',
        code: 'INVALID_INPUT'
      });
    }

    const result = await activateCode(code, email, deviceId);

    res.json(result);
  } catch (error) {
    console.error('Error activating code:', error);
    res.status(500).json({
      success: false,
      message: 'Error activating code'
    });
  }
});

/**
 * Check code status
 * GET /api/codes/status/:code
 */
router.get('/status/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const status = await getCodeStatus(code);

    res.json(status);
  } catch (error) {
    console.error('Error checking code status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking code status'
    });
  }
});

export default router;
