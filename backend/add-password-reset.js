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

async function addPasswordResetColumns() {
  const client = await pool.connect();
  
  try {
    console.log('Adding password reset columns...');

    await client.query(`
      ALTER TABLE affiliates 
      ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_expires TIMESTAMP
    `);
    
    console.log('✓ Added reset_token and reset_expires columns');
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addPasswordResetColumns();
