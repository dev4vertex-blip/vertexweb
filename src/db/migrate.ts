import { getDb } from './client.js';
import { migration_0001_core } from './migrations/0001_core_schema.js';
import { migration_0002_production } from './migrations/0002_production_tables.js';
import { migration_0003_indexes } from './migrations/0003_indexes_and_constraints.js';
import { migration_0004_financial } from './migrations/0004_financial_integrity.js';

export async function runMigrations() {
  const { client } = await getDb();

  console.log('Running zero-downtime PostgreSQL migrations on Supabase/PostgreSQL...');

  // 1. Migration 0001: Core Baseline Schema
  console.log('Applying Migration 0001: Core baseline schema...');
  await client.exec(migration_0001_core);

  // 2. Migration 0002: Additive Production Tables (Services, Bookings, Invoices, AMC, Partners, Fleet, Support, HR, Payroll, Webhooks)
  console.log('Applying Migration 0002: Additive production tables...');
  await client.exec(migration_0002_production);

  // 3. Ensure canonical locations columns & view
  const canonicalViewsSQL = `
    -- Ensure canonical location columns on cities table
    ALTER TABLE cities ADD COLUMN IF NOT EXISTS code TEXT;
    ALTER TABLE cities ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';
    ALTER TABLE cities ADD COLUMN IF NOT EXISTS city TEXT;
    ALTER TABLE cities ADD COLUMN IF NOT EXISTS area TEXT;
    ALTER TABLE cities ADD COLUMN IF NOT EXISTS pincode TEXT;
    ALTER TABLE cities ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE cities ADD COLUMN IF NOT EXISTS latitude REAL;
    ALTER TABLE cities ADD COLUMN IF NOT EXISTS longitude REAL;
    ALTER TABLE cities ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE cities ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
    ALTER TABLE cities ADD COLUMN IF NOT EXISTS created_by TEXT;
    ALTER TABLE cities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE cities ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

    -- Canonical locations view for seamless backward-compatible SQL resolution
    CREATE OR REPLACE VIEW locations AS
    SELECT 
      c.id,
      c.name,
      c.code,
      c.country,
      c.state_id,
      s.name AS state_name,
      s.code AS state_code,
      c.city,
      c.area,
      c.pincode,
      c.address,
      c.latitude,
      c.longitude,
      c.description,
      c.tier,
      c.active,
      c.status,
      c.created_by,
      c.created_at,
      c.updated_at,
      c.deleted_at
    FROM cities c
    LEFT JOIN states s ON c.state_id = s.id;
  `;
  await client.exec(canonicalViewsSQL);

  // 4. Migration 0003: Targeted Production Indexes & Integrity Constraints
  console.log('Applying Migration 0003: Performance indexes and constraints...');
  await client.exec(migration_0003_indexes);

  // 5. Migration 0004: Financial Ledger & Financial Integrity Constraints
  console.log('Applying Migration 0004: Financial ledger and constraints...');
  await client.exec(migration_0004_financial);

  console.log('PostgreSQL migrations applied successfully. Production schema is up to date.');
}

// Run directly if invoked from CLI
if (process.argv[1]?.endsWith('migrate.ts') || process.argv[1]?.endsWith('migrate.js')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
