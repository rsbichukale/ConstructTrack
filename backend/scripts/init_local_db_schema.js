const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const PASSWORD = 'Rutuja@987';

async function initLocalDbRolesAndSchema() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: PASSWORD,
    database: 'constructtrack_db'
  });

  await client.connect();
  console.log('Connected to local constructtrack_db...');

  // 1. Create standard application roles in local Postgres
  console.log('Creating standard application roles (anon, authenticated, service_role)...');
  const createRolesSql = `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
      END IF;
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
      END IF;
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN;
      END IF;
    END
    $$;
  `;
  await client.query(createRolesSql);
  console.log('✅ Roles initialized!');

  // 2. Read and apply schema.sql
  console.log('Applying master schema.sql...');
  const schemaPath = path.join(__dirname, '../../database/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Strip Supabase auth triggers that listen to auth.users table (since local Postgres doesn't have auth schema)
  const cleanSql = schemaSql
    .replace(/CREATE TRIGGER trg_sync_auth_user_insert[\s\S]*?FOR EACH ROW EXECUTE FUNCTION public\.fn_sync_auth_user_to_public\(\);/gi, '-- skipped auth trigger for local')
    .replace(/CREATE TRIGGER trg_sync_auth_user_update[\s\S]*?FOR EACH ROW EXECUTE FUNCTION public\.fn_sync_auth_user_to_public\(\);/gi, '-- skipped auth trigger for local')
    .replace(/CREATE TRIGGER trg_sync_auth_user_delete[\s\S]*?FOR EACH ROW EXECUTE FUNCTION public\.fn_sync_auth_user_to_public\(\);/gi, '-- skipped auth trigger for local');

  await client.query(cleanSql);
  console.log('✅ Master schema applied with 0 errors!');

  await client.end();
}

initLocalDbRolesAndSchema().then(() => process.exit(0)).catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
