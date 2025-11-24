import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
});

async function addDiscountCodesTable() {
  const client = await pool.connect();
  
  try {
    console.log('Adding discount_codes table...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS discount_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(8) UNIQUE NOT NULL,
        affiliate_code VARCHAR(50) NOT NULL,
        discount_percent INTEGER DEFAULT 15,
        uses_count INTEGER DEFAULT 0,
        max_uses INTEGER DEFAULT 1,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        FOREIGN KEY (affiliate_code) REFERENCES affiliates(code) ON DELETE CASCADE
      )
    `);
    
    console.log('✓ Created discount_codes table');
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addDiscountCodesTable();
