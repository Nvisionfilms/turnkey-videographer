// Quick setup - run with: node quick-setup.js
import pg from 'pg';
const { Client } = pg;

// Use the internal Railway URL
const client = new Client({
  connectionString: 'postgresql://postgres:oWUagyFsxDFeIiTUSzixAUEgWljnquVT@postgres.railway.internal:5432/railway',
  ssl: false // No SSL for internal connection
});

async function setup() {
  try {
    await client.connect();
    console.log('✓ Connected!');
    
    await client.query(`CREATE TABLE IF NOT EXISTS affiliates (id SERIAL PRIMARY KEY, code VARCHAR(50) UNIQUE NOT NULL, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, paypal_email VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, total_clicks INTEGER DEFAULT 0, total_conversions INTEGER DEFAULT 0, total_earnings DECIMAL(10, 2) DEFAULT 0, pending_payout DECIMAL(10, 2) DEFAULT 0, paid_out DECIMAL(10, 2) DEFAULT 0, status VARCHAR(50) DEFAULT 'active')`);
    console.log('✓ affiliates');
    
    await client.query(`CREATE TABLE IF NOT EXISTS unlock_codes (id SERIAL PRIMARY KEY, code VARCHAR(50) UNIQUE NOT NULL, status VARCHAR(50) DEFAULT 'available', user_email VARCHAR(255), affiliate_code VARCHAR(50), activated_at TIMESTAMP, expires_at TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    console.log('✓ unlock_codes');
    
    await client.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, unlock_code VARCHAR(50) UNIQUE NOT NULL, subscription_type VARCHAR(50) DEFAULT 'one-time', activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, expires_at TIMESTAMP, status VARCHAR(50) DEFAULT 'active')`);
    console.log('✓ users');
    
    await client.query(`CREATE TABLE IF NOT EXISTS conversions (id SERIAL PRIMARY KEY, affiliate_code VARCHAR(50) NOT NULL, unlock_key VARCHAR(255) NOT NULL, amount DECIMAL(10, 2) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, status VARCHAR(50) DEFAULT 'completed')`);
    console.log('✓ conversions');
    
    await client.query(`CREATE TABLE IF NOT EXISTS admins (id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, name VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    console.log('✓ admins');
    
    console.log('\n✅ All tables created!');
    
    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setup();
