import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function deleteUser(email) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Delete from users table
    const userResult = await client.query(
      'DELETE FROM users WHERE email = $1 RETURNING *',
      [email.toLowerCase()]
    );
    
    // Delete from unlock_codes table
    const codeResult = await client.query(
      'DELETE FROM unlock_codes WHERE user_email = $1 RETURNING *',
      [email.toLowerCase()]
    );
    
    await client.query('COMMIT');
    
    console.log(`✅ Deleted user ${email}:`);
    console.log('User record:', userResult.rows[0]);
    console.log('Code records:', codeResult.rows);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error deleting user:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

deleteUser('nvisionmg@gmail.com');
