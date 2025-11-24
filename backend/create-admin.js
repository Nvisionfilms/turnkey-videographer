import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load .env.local first, then .env
dotenv.config({ path: '.env.local' });
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createAdmin() {
  const client = await pool.connect();
  
  try {
    console.log('Creating admin user...');

    const email = 'nvisionmg@gmail.com';
    const password = 'NOPmg512!';
    const name = 'NVision Admin';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if admin already exists
    const existing = await client.query(
      'SELECT id FROM admins WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      console.log('⚠️  Admin already exists, updating password...');
      await client.query(
        'UPDATE admins SET password = $1, name = $2 WHERE email = $3',
        [hashedPassword, name, email]
      );
      console.log('✅ Admin password updated!');
    } else {
      // Insert admin
      await client.query(
        'INSERT INTO admins (email, password, name) VALUES ($1, $2, $3)',
        [email, hashedPassword, name]
      );
      console.log('✅ Admin created successfully!');
    }

    console.log('');
    console.log('Admin credentials:');
    console.log('  Email:', email);
    console.log('  Password: NOPmg512!');
    console.log('');

  } catch (error) {
    console.error('❌ Failed to create admin:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createAdmin().catch(console.error);
