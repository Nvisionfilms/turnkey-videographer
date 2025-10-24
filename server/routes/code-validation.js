import express from 'express';
import { validateCode, activateCode, getCodeStatus } from '../services/codeManager.js';

const router = express.Router();

// Parse JSON for API routes
router.use(express.json());

/**
 * Validate a code (check if it exists and is valid)
 * POST /api/codes/validate
 */
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Code is required'
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
router.post('/activate', async (req, res) => {
  try {
    const { code, email, deviceId } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Code is required'
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
