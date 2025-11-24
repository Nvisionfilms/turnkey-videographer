import pg from 'pg';
import dotenv from 'dotenv';

// Load .env.local first, then .env
dotenv.config({ path: '.env.local' });
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database migration...');

    // Create affiliates table
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
    console.log('✓ Created affiliates table');

    // Create unlock_codes table
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
    console.log('✓ Created unlock_codes table');

    // Create users table (for people who unlock the calculator)
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
    console.log('✓ Created users table');

    // Create conversions table
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
    console.log('✓ Created conversions table');

    // Create admins table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created admins table');

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_affiliates_email ON affiliates(email);
      CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(code);
      CREATE INDEX IF NOT EXISTS idx_conversions_affiliate ON conversions(affiliate_code);
      CREATE INDEX IF NOT EXISTS idx_unlock_codes_code ON unlock_codes(code);
      CREATE INDEX IF NOT EXISTS idx_unlock_codes_status ON unlock_codes(status);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_unlock_code ON users(unlock_code);
      CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
    `);
    console.log('✓ Created indexes');

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
