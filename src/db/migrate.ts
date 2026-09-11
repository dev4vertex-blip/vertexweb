import { getDb } from './client.js';

export async function runMigrations() {
  const { client } = await getDb();

  console.log('Running PostgreSQL migrations on Supabase...');

  const migrationSQL = `
    CREATE TABLE IF NOT EXISTS states (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cities (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      state_id INTEGER NOT NULL REFERENCES states(id),
      tier INTEGER DEFAULT 1 NOT NULL,
      active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS roles (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      is_system_role BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS permissions (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      id SERIAL PRIMARY KEY,
      role_code TEXT NOT NULL REFERENCES roles(code) ON DELETE CASCADE,
      permission_code TEXT NOT NULL REFERENCES permissions(code) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      CONSTRAINT unique_role_permission UNIQUE (role_code, permission_code)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      public_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      password_hash TEXT,
      role TEXT NOT NULL REFERENCES roles(code),
      status TEXT DEFAULT 'ACTIVE' NOT NULL,
      profile_image TEXT,
      city_id INTEGER REFERENCES cities(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      last_login_at TIMESTAMP,
      deleted_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_location_scopes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      city_id INTEGER REFERENCES cities(id),
      state_id INTEGER REFERENCES states(id),
      scope_type TEXT DEFAULT 'CITY' NOT NULL,
      is_primary BOOLEAN DEFAULT FALSE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customer_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      customer_type TEXT DEFAULT 'INDIVIDUAL' NOT NULL,
      preferred_language TEXT DEFAULT 'English',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS technician_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      skills TEXT DEFAULT '[]' NOT NULL,
      service_areas TEXT DEFAULT '[]' NOT NULL,
      experience_years INTEGER DEFAULT 3 NOT NULL,
      rating REAL DEFAULT 4.8 NOT NULL,
      jobs_assigned INTEGER DEFAULT 0 NOT NULL,
      jobs_completed INTEGER DEFAULT 0 NOT NULL,
      verification_status TEXT DEFAULT 'VERIFIED' NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sales_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      employee_type TEXT DEFAULT 'FULL_TIME' NOT NULL,
      compensation_model TEXT DEFAULT 'FIXED_PLUS_COMMISSION' NOT NULL,
      base_salary NUMERIC DEFAULT 45000 NOT NULL,
      commission_rate NUMERIC DEFAULT 8.5 NOT NULL,
      monthly_target NUMERIC DEFAULT 250000 NOT NULL,
      revenue_generated NUMERIC DEFAULT 0 NOT NULL,
      bookings_created INTEGER DEFAULT 0 NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS manager_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      assigned_region TEXT DEFAULT 'Delhi NCR' NOT NULL,
      department TEXT DEFAULT 'Hub Operations & Fleet' NOT NULL,
      direct_reports_count INTEGER DEFAULT 0 NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS finance_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      department TEXT DEFAULT 'Accounts & Audit' NOT NULL,
      approval_limit NUMERIC DEFAULT 500000 NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity TEXT DEFAULT 'USER' NOT NULL,
      entity_id TEXT,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_permissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      permission_code TEXT NOT NULL REFERENCES permissions(code) ON DELETE CASCADE,
      granted_by TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      CONSTRAINT unique_user_permission UNIQUE (user_id, permission_code)
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      public_id TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      company_name TEXT,
      phone TEXT NOT NULL,
      alternate_phone TEXT,
      email TEXT,
      address TEXT,
      service_interest TEXT NOT NULL,
      service_category TEXT,
      requirement_details TEXT,
      estimated_value NUMERIC DEFAULT 0 NOT NULL,
      lead_source TEXT NOT NULL,
      priority TEXT DEFAULT 'MEDIUM' NOT NULL,
      stage TEXT DEFAULT 'NEW' NOT NULL,
      status TEXT DEFAULT 'ACTIVE' NOT NULL,
      loss_reason TEXT,
      won_booking_id TEXT,
      won_customer_id TEXT,
      assigned_to TEXT REFERENCES users(id),
      created_by TEXT REFERENCES users(id),
      city_id INTEGER REFERENCES cities(id),
      expected_followup_date DATE,
      expected_followup_time TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      deleted_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lead_followups (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      scheduled_date DATE NOT NULL,
      scheduled_time TEXT,
      followup_type TEXT DEFAULT 'CALL',
      notes TEXT NOT NULL,
      outcome TEXT,
      status TEXT DEFAULT 'OPEN' NOT NULL,
      completed BOOLEAN DEFAULT FALSE NOT NULL,
      completed_at TIMESTAMP,
      completed_by TEXT REFERENCES users(id),
      cancellation_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
    CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by);
    CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
    CREATE INDEX IF NOT EXISTS idx_lead_followups_lead_id ON lead_followups(lead_id);
    CREATE INDEX IF NOT EXISTS idx_lead_followups_scheduled ON lead_followups(scheduled_date, status);

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

    CREATE INDEX IF NOT EXISTS idx_cities_code ON cities(code);
    CREATE INDEX IF NOT EXISTS idx_cities_status ON cities(status);
    CREATE INDEX IF NOT EXISTS idx_cities_active ON cities(active);

    -- Canonical locations view for seamless SQL query resolution
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

  await client.exec(migrationSQL);
  console.log('PostgreSQL migrations applied successfully.');
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
