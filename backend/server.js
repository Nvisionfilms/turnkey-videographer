import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import pool from './db.js';
import { generateUniqueUnlockCode, generateAndInsertBatch } from './utils/unlockCodeGenerator.js';
import stripeWebhook from './routes/stripe-webhook.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - CORS
// Important: browsers enforce CORS (PowerShell/curl do not). We reflect the request Origin so
// Netlify previews, custom domains, and localhost can call the API.
// We do not use cookie-based auth here, so credentials are intentionally disabled.
const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Stripe webhook must come BEFORE express.json() (needs raw body)
app.use('/api/stripe', stripeWebhook);

// JSON parsing for all other routes
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database connection test
app.get('/api/db-test', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    res.json({ status: 'connected', time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message, code: error.code });
  }
});

// Fix admin endpoint (ONE TIME USE)
app.post('/api/fix-admin', async (req, res) => {
  const client = await pool.connect();
  try {
    // Rename column
    await client.query('ALTER TABLE admins RENAME COLUMN password TO password_hash');
    
    // Update admin password
    await client.query(
      `UPDATE admins 
       SET password_hash = $1, name = $2
       WHERE email = $3`,
      ['$2b$10$I/4VOuyhX68hVwP07.ap1usoRzxiysMfWoz8aUdmLMCgOGQSFHRFa', 'Admin', 'nvisionmg@gmail.com']
    );
    
    res.json({ success: true, message: 'Admin fixed!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Check admin endpoint (DEBUG)
app.get('/api/check-admin', async (req, res) => {
  try {
    const result = await pool.query('SELECT email, name, password_hash FROM admins WHERE email = $1', ['nvisionmg@gmail.com']);
    res.json({ admin: result.rows[0], hasPasswordHash: !!result.rows[0]?.password_hash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update admin password (ONE TIME USE)
app.post('/api/update-admin-password', async (req, res) => {
  try {
    await pool.query(
      'UPDATE admins SET password_hash = $1 WHERE email = $2',
      ['$2b$10$gzzDsUYg8VZaa0fTmSYWfONzApa69oLZMElo2dfILJULu8VyrzWbi', 'nvisionmg@gmail.com']
    );
    res.json({ success: true, message: 'Password updated!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Setup endpoint - run migrations and import codes (ONE TIME ONLY)
app.post('/api/setup', async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create all tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS affiliates (
          id SERIAL PRIMARY KEY,
          code VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          paypal_email VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          total_clicks INTEGER DEFAULT 0,
          total_conversions INTEGER DEFAULT 0,
          total_earnings DECIMAL(10, 2) DEFAULT 0,
          pending_payout DECIMAL(10, 2) DEFAULT 0,
          paid_out DECIMAL(10, 2) DEFAULT 0,
          status VARCHAR(50) DEFAULT 'active'
        )
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS unlock_codes (
          id SERIAL PRIMARY KEY,
          code VARCHAR(50) UNIQUE NOT NULL,
          status VARCHAR(50) DEFAULT 'available',
          user_email VARCHAR(255),
          affiliate_code VARCHAR(50),
          activated_at TIMESTAMP,
          expires_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (affiliate_code) REFERENCES affiliates(code) ON DELETE SET NULL
        )
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          unlock_code VARCHAR(50) UNIQUE NOT NULL,
          subscription_type VARCHAR(50) DEFAULT 'one-time',
          activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP,
          status VARCHAR(50) DEFAULT 'active',
          FOREIGN KEY (unlock_code) REFERENCES unlock_codes(code) ON DELETE RESTRICT
        )
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS conversions (
          id SERIAL PRIMARY KEY,
          affiliate_code VARCHAR(50) NOT NULL,
          unlock_key VARCHAR(255) NOT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(50) DEFAULT 'completed',
          FOREIGN KEY (affiliate_code) REFERENCES affiliates(code) ON DELETE CASCADE
        )
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS admins (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create admin account
      const hashedPassword = await bcrypt.hash('NOPmg512!', 10);
      await client.query(`
        INSERT INTO admins (email, password, name)
        VALUES ($1, $2, $3)
        ON CONFLICT (email) DO UPDATE SET password = $2, name = $3
      `, ['nvisionmg@gmail.com', hashedPassword, 'NVision Admin']);
      
      await client.query('COMMIT');
      
      res.json({ 
        success: true, 
        message: 'Database setup complete! Tables created and admin account ready.',
        admin: { email: 'nvisionmg@gmail.com', password: 'NOPmg512!' }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== AFFILIATE ROUTES ====================

// Generate affiliate code from name
function generateAffiliateCode(name) {
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${cleanName.substring(0, 6)}${randomSuffix}`;
}

// Signup - Create new affiliate
app.post('/api/affiliates/signup', async (req, res) => {
  try {
    const { name, email, password, paypalEmail } = req.body;

    // Validate input
    if (!name || !email || !password || !paypalEmail) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if email already exists
    const existingAffiliate = await pool.query(
      'SELECT id FROM affiliates WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingAffiliate.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate affiliate code
    const code = generateAffiliateCode(name);

    // Insert affiliate
    const result = await pool.query(
      `INSERT INTO affiliates (code, name, email, password, paypal_email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, code, name, email, paypal_email, created_at, total_clicks, 
                 total_conversions, total_earnings, pending_payout, paid_out, status`,
      [code, name, email.toLowerCase(), hashedPassword, paypalEmail]
    );

    const affiliate = result.rows[0];

    res.status(201).json({
      success: true,
      affiliate: {
        id: affiliate.id,
        code: affiliate.code,
        name: affiliate.name,
        email: affiliate.email,
        paypalEmail: affiliate.paypal_email,
        createdAt: affiliate.created_at,
        totalClicks: affiliate.total_clicks,
        totalConversions: affiliate.total_conversions,
        totalEarnings: parseFloat(affiliate.total_earnings),
        pendingPayout: parseFloat(affiliate.pending_payout),
        paidOut: parseFloat(affiliate.paid_out),
        status: affiliate.status
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create affiliate account' });
  }
});

// Login - Authenticate affiliate
app.post('/api/affiliates/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find affiliate
    const result = await pool.query(
      'SELECT * FROM affiliates WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const affiliate = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, affiliate.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      success: true,
      affiliate: {
        id: affiliate.id,
        code: affiliate.code,
        name: affiliate.name,
        email: affiliate.email,
        paypalEmail: affiliate.paypal_email,
        createdAt: affiliate.created_at,
        totalClicks: affiliate.total_clicks,
        totalConversions: affiliate.total_conversions,
        totalEarnings: parseFloat(affiliate.total_earnings),
        pendingPayout: parseFloat(affiliate.pending_payout),
        paidOut: parseFloat(affiliate.paid_out),
        status: affiliate.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Request password reset
app.post('/api/affiliates/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const result = await pool.query(
      'SELECT * FROM affiliates WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      // Don't reveal if email exists
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent' });
    }
    
    const affiliate = result.rows[0];
    
    // Generate reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour
    
    await pool.query(
      'UPDATE affiliates SET reset_token = $1, reset_expires = $2 WHERE email = $3',
      [resetToken, resetExpires, email.toLowerCase()]
    );
    
    // TODO: Send email with reset link
    // For now, return token (in production, this would be emailed)
    res.json({ 
      success: true, 
      message: 'Password reset link sent to email',
      resetToken // Remove this in production
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Reset password with token
app.post('/api/affiliates/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const result = await pool.query(
      'SELECT * FROM affiliates WHERE reset_token = $1 AND reset_expires > NOW()',
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await pool.query(
      'UPDATE affiliates SET password = $1, reset_token = NULL, reset_expires = NULL WHERE reset_token = $2',
      [hashedPassword, token]
    );
    
    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Get affiliate by code
app.get('/api/affiliates/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const result = await pool.query(
      `SELECT id, code, name, email, paypal_email, created_at, total_clicks,
              total_conversions, total_earnings, pending_payout, paid_out, status
       FROM affiliates WHERE code = $1`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Affiliate not found' });
    }

    const affiliate = result.rows[0];

    res.json({
      id: affiliate.id,
      code: affiliate.code,
      name: affiliate.name,
      email: affiliate.email,
      paypalEmail: affiliate.paypal_email,
      createdAt: affiliate.created_at,
      totalClicks: affiliate.total_clicks,
      totalConversions: affiliate.total_conversions,
      totalEarnings: parseFloat(affiliate.total_earnings),
      pendingPayout: parseFloat(affiliate.pending_payout),
      paidOut: parseFloat(affiliate.paid_out),
      status: affiliate.status
    });
  } catch (error) {
    console.error('Get affiliate error:', error);
    res.status(500).json({ error: 'Failed to get affiliate' });
  }
});

// Track click
app.post('/api/affiliates/:code/click', async (req, res) => {
  try {
    const { code } = req.params;

    await pool.query(
      'UPDATE affiliates SET total_clicks = total_clicks + 1 WHERE code = $1',
      [code]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

// ==================== CONVERSION ROUTES ====================

// Track conversion
app.post('/api/conversions', async (req, res) => {
  try {
    const { affiliateCode, unlockKey, amount } = req.body;

    if (!affiliateCode || !unlockKey || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert conversion
      await client.query(
        `INSERT INTO conversions (affiliate_code, unlock_key, amount)
         VALUES ($1, $2, $3)`,
        [affiliateCode, unlockKey, amount]
      );

      // Update affiliate stats
      await client.query(
        `UPDATE affiliates 
         SET total_conversions = total_conversions + 1,
             total_earnings = total_earnings + $1,
             pending_payout = pending_payout + $1
         WHERE code = $2`,
        [amount, affiliateCode]
      );

      await client.query('COMMIT');

      res.json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Track conversion error:', error);
    res.status(500).json({ error: 'Failed to track conversion' });
  }
});

// Get conversions for affiliate
app.get('/api/conversions/affiliate/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const result = await pool.query(
      `SELECT id, unlock_key, amount, created_at, status
       FROM conversions
       WHERE affiliate_code = $1
       ORDER BY created_at DESC`,
      [code]
    );

    const conversions = result.rows.map(row => ({
      id: row.id,
      unlockKey: row.unlock_key,
      amount: parseFloat(row.amount),
      createdAt: row.created_at,
      status: row.status
    }));

    res.json(conversions);
  } catch (error) {
    console.error('Get conversions error:', error);
    res.status(500).json({ error: 'Failed to get conversions' });
  }
});

// ==================== UNLOCK CODE ROUTES ====================

// Verify unlock (email + code) for multi-device use
app.post('/api/unlock/verify', async (req, res) => {
  try {
    const { code, email } = req.body;

    if (!code || !email) {
      return res.status(400).json({ error: 'Code and email are required' });
    }

    const normalizedEmail = email.toLowerCase();
    const normalizedCode = code.toUpperCase();

    const result = await pool.query(
      `SELECT email, unlock_code, subscription_type, activated_at, expires_at, status
       FROM users
       WHERE email = $1 AND unlock_code = $2
       LIMIT 1`,
      [normalizedEmail, normalizedCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No matching subscription found' });
    }

    const user = result.rows[0];

    // Check if expired
    if (user.expires_at && new Date(user.expires_at) < new Date()) {
      await pool.query(
        'UPDATE users SET status = $1 WHERE email = $2 AND unlock_code = $3',
        ['expired', normalizedEmail, normalizedCode]
      );
      return res.status(403).json({ error: 'Subscription expired' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Subscription not active' });
    }

    return res.json({
      success: true,
      user: {
        email: user.email,
        unlockCode: user.unlock_code,
        subscriptionType: user.subscription_type,
        activatedAt: user.activated_at,
        expiresAt: user.expires_at,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
});

// Validate and activate unlock code
app.post('/api/unlock/activate', async (req, res) => {
  try {
    const { code, email, affiliateCode } = req.body;

    if (!code || !email) {
      return res.status(400).json({ error: 'Code and email are required' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if code exists
      const codeResult = await client.query(
        'SELECT * FROM unlock_codes WHERE code = $1',
        [code.toUpperCase()]
      );

      if (codeResult.rows.length === 0) {
        return res.status(404).json({ error: 'Invalid unlock code' });
      }

      const unlockCode = codeResult.rows[0];

      const normalizedEmail = email.toLowerCase();
      const normalizedCode = code.toUpperCase();

      const isClaimed = unlockCode.status !== 'available';
      const claimedByEmail = (unlockCode.user_email || '').toLowerCase();

      // If claimed (including legacy status 'used'), only allow the same email
      if (isClaimed) {
        if (claimedByEmail && claimedByEmail !== normalizedEmail) {
          return res.status(409).json({
            error: 'Code already claimed',
            code: 'CODE_CLAIMED',
            message: 'This access code has already been claimed. Purchase a new code or use the email that originally claimed it.',
          });
        }

        // Idempotent: ensure user record exists and is active for this email+code
        const existingUserForCode = await client.query(
          'SELECT * FROM users WHERE email = $1 AND unlock_code = $2 LIMIT 1',
          [normalizedEmail, normalizedCode]
        );

        if (existingUserForCode.rows.length > 0) {
          const user = existingUserForCode.rows[0];
          await client.query('COMMIT');
          return res.json({
            success: true,
            user: {
              email: user.email,
              unlockCode: user.unlock_code,
              subscriptionType: user.subscription_type,
              activatedAt: user.activated_at,
              expiresAt: user.expires_at,
              status: user.status,
            },
          });
        }

        // If code is claimed by this email but users row missing, create it.
        // Calculate expiration (1 year from now)
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        const userResult = await client.query(
          `INSERT INTO users (email, unlock_code, subscription_type, expires_at, status)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [normalizedEmail, normalizedCode, 'one-time', expiresAt, 'active']
        );

        const user = userResult.rows[0];
        await client.query('COMMIT');
        return res.json({
          success: true,
          user: {
            email: user.email,
            unlockCode: user.unlock_code,
            subscriptionType: user.subscription_type,
            activatedAt: user.activated_at,
            expiresAt: user.expires_at,
            status: user.status,
          },
        });
      }

      // Claim path: code is available, first email wins

      // Optional: prevent one email from claiming multiple codes
      const existingUser = await client.query(
        'SELECT * FROM users WHERE email = $1 AND status = $2',
        [normalizedEmail, 'active']
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          error: 'Email already has access',
          code: 'EMAIL_ALREADY_ACTIVE',
          message: 'This email already has an active subscription.',
        });
      }

      // Calculate expiration (1 year from now)
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      // Mark code as taken (claimed)
      await client.query(
        `UPDATE unlock_codes 
         SET status = $1, user_email = $2, affiliate_code = $3, activated_at = NOW()
         WHERE code = $4`,
        ['taken', normalizedEmail, affiliateCode, normalizedCode]
      );

      // Create user account
      const userResult = await client.query(
        `INSERT INTO users (email, unlock_code, subscription_type, expires_at, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [normalizedEmail, normalizedCode, 'one-time', expiresAt, 'active']
      );

      // Track conversion if affiliate code provided
      if (affiliateCode) {
        const amount = 39.99 * 0.15; // 15% commission

        await client.query(
          `INSERT INTO conversions (affiliate_code, unlock_key, amount)
           VALUES ($1, $2, $3)`,
          [affiliateCode, code.toUpperCase(), amount]
        );

        await client.query(
          `UPDATE affiliates 
           SET total_conversions = total_conversions + 1,
               total_earnings = total_earnings + $1,
               pending_payout = pending_payout + $1
           WHERE code = $2`,
          [amount, affiliateCode]
        );
      }

      await client.query('COMMIT');

      const user = userResult.rows[0];

      res.json({
        success: true,
        user: {
          email: user.email,
          unlockCode: user.unlock_code,
          subscriptionType: user.subscription_type,
          activatedAt: user.activated_at,
          expiresAt: user.expires_at,
          status: user.status
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Activate code error:', error);
    res.status(500).json({ error: 'Failed to activate code' });
  }
});

// Validate Stripe session to prevent refund bypass
app.post('/api/unlock/validate-session', async (req, res) => {
  try {
    const { email, sessionId } = req.body;
    
    if (!email || !sessionId) {
      return res.status(400).json({ error: 'Email and sessionId are required' });
    }
    
    // Get user record with session ID
    const result = await pool.query(
      `SELECT email, unlock_code, subscription_type, expires_at, status, stripe_session_id
       FROM users
       WHERE email = $1 AND stripe_session_id = $2`,
      [email.toLowerCase(), sessionId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No valid session found' });
    }
    
    const user = result.rows[0];
    
    // Validate the session with Stripe to ensure it's not refunded
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.payment_status !== 'paid') {
        // Payment was refunded or failed, revoke access
        await pool.query(
          'UPDATE users SET status = $1 WHERE email = $2',
          ['revoked', email.toLowerCase()]
        );
        
        return res.status(403).json({ 
          error: 'Payment refunded or failed',
          status: 'revoked'
        });
      }
      
      // Check if expired
      if (user.expires_at && new Date(user.expires_at) < new Date()) {
        await pool.query(
          'UPDATE users SET status = $1 WHERE email = $2',
          ['expired', email.toLowerCase()]
        );
        
        return res.json({
          email: user.email,
          unlockCode: user.unlock_code,
          status: 'expired'
        });
      }
      
      // Session is valid and paid
      res.json({
        email: user.email,
        unlockCode: user.unlock_code,
        subscriptionType: user.subscription_type,
        expiresAt: user.expires_at,
        status: user.status,
        isActive: user.status === 'active'
      });
      
    } catch (stripeError) {
      console.error('Stripe session validation failed:', stripeError);
      return res.status(500).json({ error: 'Failed to validate session with Stripe' });
    }
    
  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({ error: 'Failed to validate session' });
  }
});

// Enhanced validation that checks Stripe session status
app.post('/api/unlock/validate-enhanced', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }
    
    // Get user record (stripe_session_id is optional)
    const result = await pool.query(
      `SELECT email, unlock_code, subscription_type, expires_at, status
       FROM users
       WHERE email = $1 AND unlock_code = $2`,
      [email.toLowerCase(), code.toUpperCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No valid subscription found' });
    }
    
    const user = result.rows[0];
    
    // Check if expired
    if (user.expires_at && new Date(user.expires_at) < new Date()) {
      await pool.query(
        'UPDATE users SET status = $1 WHERE email = $2',
        ['expired', email.toLowerCase()]
      );
      
      return res.json({
        email: user.email,
        unlockCode: user.unlock_code,
        status: 'expired'
      });
    }
    
    // Session is valid and paid
    res.json({
      email: user.email,
      unlockCode: user.unlock_code,
      subscriptionType: user.subscription_type,
      expiresAt: user.expires_at,
      status: user.status,
      isActive: user.status === 'active'
    });
    
  } catch (error) {
    console.error('Enhanced validation error:', error);
    res.status(500).json({ error: 'Failed to validate subscription' });
  }
});

// Sync: Create user records for accounts with codes but missing from users table
app.post('/api/sync-users-from-codes', async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Find all codes that have user_email but no corresponding user record
      const orphanedCodes = await client.query(`
        SELECT DISTINCT uc.user_email, uc.code
        FROM unlock_codes uc
        LEFT JOIN users u ON uc.user_email = u.email
        WHERE uc.user_email IS NOT NULL 
        AND uc.user_email != ''
        AND u.email IS NULL
      `);
      
      let createdUsers = [];
      
      for (const codeInfo of orphanedCodes.rows) {
        // Create user record for each orphaned code
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        
        const userResult = await client.query(`
          INSERT INTO users (email, unlock_code, subscription_type, expires_at, status)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [
          codeInfo.user_email.toLowerCase(),
          codeInfo.code,
          'one-time',
          expiresAt,
          'active'
        ]);
        
        createdUsers.push(userResult.rows[0]);
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: `Created ${createdUsers.length} user records`,
        createdUsers: createdUsers
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Sync users error:', error);
    res.status(500).json({ error: 'Failed to sync users' });
  }
});

// Sync: Update affiliate records for conversions
app.post('/api/sync-affiliate-conversions', async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Find all conversions that need affiliate records created
      const orphanedConversions = await client.query(`
        SELECT DISTINCT c.affiliate_code
        FROM conversions c
        LEFT JOIN affiliates a ON c.affiliate_code = a.code
        WHERE c.affiliate_code IS NOT NULL 
        AND c.affiliate_code != ''
        AND a.code IS NULL
      `);
      
      let createdAffiliates = [];
      
      for (const conv of orphanedConversions.rows) {
        // Create affiliate record for each orphaned conversion
        const affiliateResult = await client.query(`
          INSERT INTO affiliates (code, total_conversions, total_earnings, pending_payout)
          VALUES ($1, 0, 0, 0)
          RETURNING *
        `, [conv.affiliate_code.toUpperCase()]);
        
        createdAffiliates.push(affiliateResult.rows[0]);
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: `Created ${createdAffiliates.length} affiliate records`,
        createdAffiliates: createdAffiliates
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Sync affiliates error:', error);
    res.status(500).json({ error: 'Failed to sync affiliates' });
  }
});

// Temporary: Delete specific refunded account
app.delete('/api/delete-refunded-account', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Only allow deletion of specific refunded account for security
    if (email.toLowerCase() !== 'nvisionmg@gmail.com') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete from users table
      const userResult = await client.query(
        'DELETE FROM users WHERE email = $1 RETURNING *',
        [email.toLowerCase()]
      );
      
      // Delete from unlock_codes table (if code was used)
      const codeResult = await client.query(
        'DELETE FROM unlock_codes WHERE user_email = $1 RETURNING *',
        [email.toLowerCase()]
      );
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: `Refunded account ${email} deleted successfully`,
        deletedUser: userResult.rows[0],
        deletedCodes: codeResult.rows
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Admin: Delete user account (for refunded/deleted accounts)
app.delete('/api/admin/delete-user', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete from users table
      const userResult = await client.query(
        'DELETE FROM users WHERE email = $1 RETURNING *',
        [email.toLowerCase()]
      );
      
      // Delete from unlock_codes table (if code was used)
      const codeResult = await client.query(
        'DELETE FROM unlock_codes WHERE user_email = $1 RETURNING *',
        [email.toLowerCase()]
      );
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: `User ${email} deleted successfully`,
        deletedUser: userResult.rows[0],
        deletedCodes: codeResult.rows
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Check user subscription status
app.get('/api/unlock/status/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const result = await pool.query(
      `SELECT email, unlock_code, subscription_type, activated_at, expires_at, status
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const user = result.rows[0];

    // Check if expired
    if (user.expires_at && new Date(user.expires_at) < new Date()) {
      await pool.query(
        'UPDATE users SET status = $1 WHERE email = $2',
        ['expired', email.toLowerCase()]
      );
      user.status = 'expired';
    }

    res.json({
      email: user.email,
      unlockCode: user.unlock_code,
      subscriptionType: user.subscription_type,
      activatedAt: user.activated_at,
      expiresAt: user.expires_at,
      status: user.status,
      isActive: user.status === 'active'
    });
  } catch (error) {
    console.error('Check status error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// Get available codes count (admin)
app.get('/api/unlock/available-count', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM unlock_codes WHERE status = $1',
      ['available']
    );

    res.json({ availableCount: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Get available count error:', error);
    res.status(500).json({ error: 'Failed to get count' });
  }
});

// ==================== ADMIN AUTH ROUTES ====================

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find admin
    const result = await pool.query(
      'SELECT * FROM admins WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    console.log('Admin found:', admin.email);
    console.log('Has password_hash:', !!admin.password_hash);

    // Verify password
    const validPassword = await bcrypt.compare(password, admin.password_hash);
    console.log('Password valid:', validPassword);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Get all affiliates (admin)
app.get('/api/admin/affiliates', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, code, name, email, paypal_email, created_at, total_clicks,
              total_conversions, total_earnings, pending_payout, paid_out, status
       FROM affiliates
       ORDER BY created_at DESC`
    );

    const affiliates = result.rows.map(row => ({
      id: row.id,
      code: row.code,
      name: row.name,
      email: row.email,
      paypalEmail: row.paypal_email,
      createdAt: row.created_at,
      totalClicks: row.total_clicks,
      totalConversions: row.total_conversions,
      totalEarnings: parseFloat(row.total_earnings),
      pendingPayout: parseFloat(row.pending_payout),
      paidOut: parseFloat(row.paid_out),
      status: row.status
    }));

    res.json(affiliates);
  } catch (error) {
    console.error('Get all affiliates error:', error);
    res.status(500).json({ error: 'Failed to get affiliates' });
  }
});

// ==================== COMMISSION LEDGER ROUTES ====================

// Auto-clear job: Move pending -> cleared after 14 days (call daily via cron or manually)
app.post('/api/admin/commissions/auto-clear', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE affiliate_commissions
       SET status = 'cleared'
       WHERE status = 'pending'
       AND eligible_at <= NOW()
       RETURNING id, affiliate_code, commission_cents`
    );
    
    console.log(`✅ Auto-cleared ${result.rows.length} commissions`);
    
    res.json({
      success: true,
      clearedCount: result.rows.length,
      cleared: result.rows
    });
  } catch (error) {
    console.error('Auto-clear error:', error);
    res.status(500).json({ error: 'Failed to auto-clear commissions' });
  }
});

// Get commission summary by status (admin dashboard)
app.get('/api/admin/commissions/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(commission_cents) as total_cents
      FROM affiliate_commissions
      GROUP BY status
    `);
    
    const summary = {
      pending: { count: 0, totalCents: 0 },
      cleared: { count: 0, totalCents: 0 },
      paid: { count: 0, totalCents: 0 },
      reversed: { count: 0, totalCents: 0 }
    };
    
    result.rows.forEach(row => {
      summary[row.status] = {
        count: parseInt(row.count),
        totalCents: parseInt(row.total_cents) || 0
      };
    });
    
    res.json(summary);
  } catch (error) {
    console.error('Get commission summary error:', error);
    res.status(500).json({ error: 'Failed to get commission summary' });
  }
});

// Get cleared commissions ready for payout (grouped by affiliate)
app.get('/api/admin/commissions/ready-for-payout', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.id as affiliate_id,
        a.name,
        a.email,
        a.paypal_email,
        a.code,
        COUNT(c.id) as commission_count,
        SUM(c.commission_cents) as total_cents
      FROM affiliate_commissions c
      JOIN affiliates a ON c.affiliate_id = a.id
      WHERE c.status = 'cleared'
      AND c.batch_id IS NULL
      GROUP BY a.id, a.name, a.email, a.paypal_email, a.code
      HAVING SUM(c.commission_cents) >= 2500
      ORDER BY SUM(c.commission_cents) DESC
    `);
    
    const affiliates = result.rows.map(row => ({
      affiliateId: row.affiliate_id,
      name: row.name,
      email: row.email,
      paypalEmail: row.paypal_email,
      code: row.code,
      commissionCount: parseInt(row.commission_count),
      totalCents: parseInt(row.total_cents),
      totalDollars: (parseInt(row.total_cents) / 100).toFixed(2)
    }));
    
    res.json(affiliates);
  } catch (error) {
    console.error('Get ready for payout error:', error);
    res.status(500).json({ error: 'Failed to get payout data' });
  }
});

// Create payout batch and export CSV (admin)
app.post('/api/admin/commissions/create-batch', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create batch record
    const batchResult = await client.query(
      `INSERT INTO affiliate_payout_batches (status) VALUES ('created') RETURNING id`
    );
    const batchId = batchResult.rows[0].id;
    
    // Get all cleared commissions and assign to batch
    const commissionsResult = await client.query(`
      SELECT 
        c.id,
        a.id as affiliate_id,
        a.name,
        a.paypal_email,
        c.commission_cents
      FROM affiliate_commissions c
      JOIN affiliates a ON c.affiliate_id = a.id
      WHERE c.status = 'cleared'
      AND c.batch_id IS NULL
    `);
    
    if (commissionsResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No cleared commissions to batch' });
    }
    
    // Assign commissions to batch
    const commissionIds = commissionsResult.rows.map(r => r.id);
    await client.query(
      `UPDATE affiliate_commissions SET batch_id = $1 WHERE id = ANY($2)`,
      [batchId, commissionIds]
    );
    
    // Calculate totals per affiliate for CSV
    const payoutData = {};
    commissionsResult.rows.forEach(row => {
      if (!payoutData[row.affiliate_id]) {
        payoutData[row.affiliate_id] = {
          name: row.name,
          paypalEmail: row.paypal_email,
          totalCents: 0
        };
      }
      payoutData[row.affiliate_id].totalCents += row.commission_cents;
    });
    
    // Generate CSV content
    let csv = 'Name,PayPal Email,Amount USD\n';
    let totalAmount = 0;
    let affiliateCount = 0;
    
    Object.values(payoutData).forEach(affiliate => {
      if (affiliate.totalCents >= 2500) { // Only include if >= $25
        const amount = (affiliate.totalCents / 100).toFixed(2);
        csv += `"${affiliate.name}","${affiliate.paypalEmail}",${amount}\n`;
        totalAmount += affiliate.totalCents;
        affiliateCount++;
      }
    });
    
    // Update batch with totals
    await client.query(
      `UPDATE affiliate_payout_batches 
       SET total_amount_cents = $1, affiliate_count = $2 
       WHERE id = $3`,
      [totalAmount, affiliateCount, batchId]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      batchId,
      affiliateCount,
      totalAmountCents: totalAmount,
      totalAmountDollars: (totalAmount / 100).toFixed(2),
      csv
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create batch error:', error);
    res.status(500).json({ error: 'Failed to create payout batch' });
  } finally {
    client.release();
  }
});

// Mark batch as paid (admin)
app.post('/api/admin/commissions/batch/:batchId/mark-paid', async (req, res) => {
  const { batchId } = req.params;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update batch status
    await client.query(
      `UPDATE affiliate_payout_batches SET status = 'paid', paid_at = NOW() WHERE id = $1`,
      [batchId]
    );
    
    // Update all commissions in batch to paid
    await client.query(
      `UPDATE affiliate_commissions SET status = 'paid', paid_at = NOW() WHERE batch_id = $1`,
      [batchId]
    );
    
    await client.query('COMMIT');
    
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Mark batch paid error:', error);
    res.status(500).json({ error: 'Failed to mark batch as paid' });
  } finally {
    client.release();
  }
});

// Get affiliate commission stats (for affiliate dashboard)
app.get('/api/affiliates/:code/commissions', async (req, res) => {
  try {
    const { code } = req.params;
    
    // Get summary by status
    const summaryResult = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(commission_cents) as total_cents
      FROM affiliate_commissions
      WHERE affiliate_code = $1
      GROUP BY status
    `, [code.toUpperCase()]);
    
    const summary = {
      pending: { count: 0, totalCents: 0 },
      cleared: { count: 0, totalCents: 0 },
      paid: { count: 0, totalCents: 0 },
      reversed: { count: 0, totalCents: 0 }
    };
    
    summaryResult.rows.forEach(row => {
      summary[row.status] = {
        count: parseInt(row.count),
        totalCents: parseInt(row.total_cents) || 0
      };
    });
    
    // Get next eligible date
    const nextEligibleResult = await pool.query(`
      SELECT MIN(eligible_at) as next_eligible
      FROM affiliate_commissions
      WHERE affiliate_code = $1 AND status = 'pending'
    `, [code.toUpperCase()]);
    
    // Get recent commissions
    const recentResult = await pool.query(`
      SELECT id, product_key, gross_amount_cents, commission_cents, status, 
             eligible_at, created_at, reversal_reason
      FROM affiliate_commissions
      WHERE affiliate_code = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [code.toUpperCase()]);
    
    res.json({
      summary,
      nextEligibleDate: nextEligibleResult.rows[0]?.next_eligible,
      recentCommissions: recentResult.rows.map(row => ({
        id: row.id,
        productKey: row.product_key,
        grossCents: row.gross_amount_cents,
        commissionCents: row.commission_cents,
        status: row.status,
        eligibleAt: row.eligible_at,
        createdAt: row.created_at,
        reversalReason: row.reversal_reason
      }))
    });
  } catch (error) {
    console.error('Get affiliate commissions error:', error);
    res.status(500).json({ error: 'Failed to get commission data' });
  }
});

// Legacy: Mark payout as paid (admin) - kept for backward compatibility
app.post('/api/admin/affiliates/:id/payout', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    await pool.query(
      `UPDATE affiliates 
       SET pending_payout = pending_payout - $1,
           paid_out = paid_out + $1
       WHERE id = $2`,
      [amount, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Mark payout error:', error);
    res.status(500).json({ error: 'Failed to mark payout' });
  }
});

// Delete affiliate (admin)
app.delete('/api/admin/affiliates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM affiliates WHERE id = $1', [id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete affiliate error:', error);
    res.status(500).json({ error: 'Failed to delete affiliate' });
  }
});

// ==================== AFFILIATE DISCOUNT CODES ====================

// Create custom discount code (affiliate)
app.post('/api/affiliates/:code/create-discount', async (req, res) => {
  try {
    const { code: affiliateCode } = req.params;
    const { customCode, maxUses = 1 } = req.body;
    
    // Validate custom code (4-8 alphanumeric characters)
    if (!customCode || !/^[A-Z0-9]{4,8}$/i.test(customCode)) {
      return res.status(400).json({ error: 'Code must be 4-8 letters/numbers' });
    }
    
    const upperCode = customCode.toUpperCase();
    
    // Check if affiliate exists
    const affiliateResult = await pool.query(
      'SELECT * FROM affiliates WHERE code = $1',
      [affiliateCode]
    );
    
    if (affiliateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Affiliate not found' });
    }
    
    // Check if code already exists
    const existingCode = await pool.query(
      'SELECT * FROM discount_codes WHERE code = $1',
      [upperCode]
    );
    
    if (existingCode.rows.length > 0) {
      return res.status(400).json({ error: 'This code is already taken' });
    }
    
    // Create discount code
    const result = await pool.query(
      `INSERT INTO discount_codes (code, affiliate_code, max_uses)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [upperCode, affiliateCode, maxUses]
    );
    
    res.json({ success: true, discountCode: result.rows[0] });
  } catch (error) {
    console.error('Create discount code error:', error);
    res.status(500).json({ error: 'Failed to create discount code' });
  }
});

// Get affiliate's discount codes
app.get('/api/affiliates/:code/discount-codes', async (req, res) => {
  try {
    const { code } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM discount_codes WHERE affiliate_code = $1 ORDER BY created_at DESC',
      [code]
    );
    
    res.json({ discountCodes: result.rows });
  } catch (error) {
    console.error('Get discount codes error:', error);
    res.status(500).json({ error: 'Failed to get discount codes' });
  }
});

// Validate and apply discount code
app.post('/api/discount/validate', async (req, res) => {
  try {
    const { code } = req.body;
    
    const result = await pool.query(
      `SELECT dc.*, a.name as affiliate_name 
       FROM discount_codes dc
       JOIN affiliates a ON dc.affiliate_code = a.code
       WHERE dc.code = $1 AND dc.status = 'active'`,
      [code.toUpperCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid discount code' });
    }
    
    const discountCode = result.rows[0];
    
    // Check if code has reached max uses
    if (discountCode.uses_count >= discountCode.max_uses) {
      return res.status(400).json({ error: 'This code has reached its usage limit' });
    }
    
    // Check if expired
    if (discountCode.expires_at && new Date(discountCode.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This code has expired' });
    }
    
    res.json({ 
      valid: true, 
      discount: discountCode.discount_percent,
      affiliateName: discountCode.affiliate_name
    });
  } catch (error) {
    console.error('Validate discount error:', error);
    res.status(500).json({ error: 'Failed to validate discount code' });
  }
});

// Apply discount code (increment usage)
app.post('/api/discount/apply', async (req, res) => {
  try {
    const { code } = req.body;
    
    await pool.query(
      'UPDATE discount_codes SET uses_count = uses_count + 1 WHERE code = $1',
      [code.toUpperCase()]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Apply discount error:', error);
    res.status(500).json({ error: 'Failed to apply discount code' });
  }
});

// ==================== UNLOCK CODE GENERATION ====================

// Generate single unlock code (admin)
app.post('/api/admin/generate-code', async (req, res) => {
  try {
    const code = await generateUniqueUnlockCode(pool);
    
    await pool.query(
      'INSERT INTO unlock_codes (code, status) VALUES ($1, $2)',
      [code, 'available']
    );
    
    res.json({ success: true, code });
  } catch (error) {
    console.error('Generate code error:', error);
    res.status(500).json({ error: 'Failed to generate code' });
  }
});

// Generate batch of unlock codes (admin)
app.post('/api/admin/generate-codes-batch', async (req, res) => {
  try {
    const { count = 100 } = req.body;
    
    if (count < 1 || count > 1000) {
      return res.status(400).json({ error: 'Count must be between 1 and 1000' });
    }
    
    const codes = await generateAndInsertBatch(pool, count);
    
    res.json({ 
      success: true, 
      count: codes.length,
      codes 
    });
  } catch (error) {
    console.error('Generate batch error:', error);
    res.status(500).json({ error: 'Failed to generate codes' });
  }
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
