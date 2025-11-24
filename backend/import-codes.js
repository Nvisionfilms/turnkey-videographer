import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local first, then .env
dotenv.config({ path: '.env.local' });
dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function importCodes() {
  const client = await pool.connect();
  
  try {
    console.log('Starting code import...');

    // Read CSV file
    const csvPath = path.join(__dirname, '..', 'UNLOCK_CODES_BATCH_1.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').slice(1); // Skip header

    let imported = 0;
    let skipped = 0;

    for (const line of lines) {
      if (!line.trim()) continue;

      const [codeNumber, unlockCode, status] = line.split(',');
      
      if (!unlockCode || !unlockCode.trim()) continue;

      try {
        // Check if code already exists
        const existing = await client.query(
          'SELECT id FROM unlock_codes WHERE code = $1',
          [unlockCode.trim()]
        );

        if (existing.rows.length > 0) {
          skipped++;
          continue;
        }

        // Insert code
        await client.query(
          `INSERT INTO unlock_codes (code, status)
           VALUES ($1, $2)`,
          [unlockCode.trim(), 'available']
        );

        imported++;
      } catch (error) {
        console.error(`Error importing code ${unlockCode}:`, error.message);
        skipped++;
      }
    }

    console.log(`✅ Import completed!`);
    console.log(`   Imported: ${imported} codes`);
    console.log(`   Skipped: ${skipped} codes`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

importCodes().catch(console.error);
