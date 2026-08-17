const fs = require('fs');
const path = require('path');
let Client;
try {
  Client = require('pg').Client;
} catch (_) {
  Client = require(path.join(__dirname, '../../backend/node_modules/pg')).Client;
}

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Rutuja%40987@localhost:5432/constructtrack_db';

async function runMigrations() {
  console.log('================================================================');
  console.log('🚀 CONSTRUCTTRACK DATABASE MIGRATION RUNNER');
  console.log('================================================================');

  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database...');

    // 1. Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Fetch applied migrations
    const appliedRes = await client.query('SELECT version FROM schema_migrations ORDER BY id ASC;');
    const appliedSet = new Set(appliedRes.rows.map(r => r.version));

    // 3. Scan migrations directory
    const migrationsDir = path.join(__dirname, '../migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found.');
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration file(s).`);

    let appliedCount = 0;
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`  ⏩ [Skipped] ${file} (already applied)`);
        continue;
      }

      console.log(`  ⚡ [Applying] ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1);', [file]);
        await client.query('COMMIT');
        console.log(`  ✅ [Applied]  ${file}`);
        appliedCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  ❌ [Error] Failed applying ${file}:`, err.message);
        throw err;
      }
    }

    console.log('================================================================');
    console.log(`🎉 MIGRATIONS COMPLETE: ${appliedCount} newly applied, ${files.length} total.`);
    console.log('================================================================');
  } catch (err) {
    console.error('Fatal migration error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations().then(() => process.exit(0)).catch(() => process.exit(1));
