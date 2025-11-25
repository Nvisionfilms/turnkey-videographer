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

// Middleware
app.use(cors());

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

      // Check if code exists and is available
      const codeResult = await client.query(
        'SELECT * FROM unlock_codes WHERE code = $1',
        [code.toUpperCase()]
      );

      if (codeResult.rows.length === 0) {
        return res.status(404).json({ error: 'Invalid unlock code' });
      }

      const unlockCode = codeResult.rows[0];

      if (unlockCode.status !== 'available') {
        return res.status(400).json({ error: 'This code has already been used' });
      }

      // Check if user already has an active subscription
      const existingUser = await client.query(
        'SELECT * FROM users WHERE email = $1 AND status = $2',
        [email.toLowerCase(), 'active']
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'This email already has an active subscription' });
      }

      // Calculate expiration (1 year from now)
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      // Mark code as used
      await client.query(
        `UPDATE unlock_codes 
         SET status = $1, user_email = $2, affiliate_code = $3, activated_at = NOW()
         WHERE code = $4`,
        ['used', email.toLowerCase(), affiliateCode, code.toUpperCase()]
      );

      // Create user account
      const userResult = await client.query(
        `INSERT INTO users (email, unlock_code, subscription_type, expires_at, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [email.toLowerCase(), code.toUpperCase(), 'one-time', expiresAt, 'active']
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

// Mark payout as paid (admin)
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
