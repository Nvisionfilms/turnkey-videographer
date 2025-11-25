import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixAdmin() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to database...');
    
    // Step 1: Rename column
    console.log('Renaming column password to password_hash...');
    await client.query('ALTER TABLE admins RENAME COLUMN password TO password_hash');
    console.log('✅ Column renamed');
    
    // Step 2: Update admin password
    console.log('Updating admin password hash...');
    await client.query(
      `UPDATE admins 
       SET password_hash = $1, name = $2
       WHERE email = $3`,
      ['$2b$10$I/4VOuyhX68hVwP07.ap1usoRzxiysMfWoz8aUdmLMCgOGQSFHRFa', 'Admin', 'nvisionmg@gmail.com']
    );
    console.log('✅ Admin password updated');
    
    // Verify
    const result = await client.query('SELECT email, name FROM admins WHERE email = $1', ['nvisionmg@gmail.com']);
    console.log('✅ Admin account:', result.rows[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    pool.end();
  }
}

fixAdmin();
