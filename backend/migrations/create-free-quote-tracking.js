import pool from '../db.js';

async function createFreeQuoteTrackingTable() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating free_quote_usage table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS free_quote_usage (
        id SERIAL PRIMARY KEY,
        device_id TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        user_agent TEXT,
        used_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    // Create indexes for fast lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_free_quote_device_id 
      ON free_quote_usage (device_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_free_quote_ip_address 
      ON free_quote_usage (ip_address)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_free_quote_used_at 
      ON free_quote_usage (used_at)
    `);
    
    await client.query('COMMIT');
    
    console.log('✅ free_quote_usage table created successfully');
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

createFreeQuoteTrackingTable();
