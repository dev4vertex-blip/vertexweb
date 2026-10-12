/**
 * 0001_core_schema.sql
 * Baseline initial schema migration (Existing tables up to Step 2A)
 * Non-destructive, idempotent CREATE TABLE IF NOT EXISTS.
 */
export const migration_0001_core = `
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

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    public_id TEXT NOT NULL UNIQUE,
    booking_id TEXT,
    customer_id TEXT REFERENCES users(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'INR' NOT NULL,
    payment_method TEXT NOT NULL,
    payment_reference TEXT,
    status TEXT DEFAULT 'COLLECTED' NOT NULL,
    collected_by TEXT REFERENCES users(id) NOT NULL,
    collected_by_name TEXT NOT NULL,
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes TEXT,
    receipt_number TEXT,
    verified_by TEXT REFERENCES users(id),
    verified_at TIMESTAMP,
    refund_reason TEXT,
    refund_status TEXT DEFAULT 'NONE' NOT NULL,
    refund_amount NUMERIC,
    refund_approved_by TEXT,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE TABLE IF NOT EXISTS promotions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    promotion_type TEXT DEFAULT 'PERCENTAGE' NOT NULL,
    discount_type TEXT DEFAULT 'PERCENTAGE' NOT NULL,
    discount_value NUMERIC NOT NULL,
    min_order_value NUMERIC DEFAULT 0,
    max_discount NUMERIC,
    start_date TEXT,
    start_time TEXT,
    end_date TEXT,
    end_time TEXT,
    applicable_categories TEXT,
    applicable_services TEXT,
    customer_segment TEXT DEFAULT 'ALL',
    usage_limit INTEGER DEFAULT 1000,
    usage_count INTEGER DEFAULT 0,
    per_customer_limit INTEGER DEFAULT 1,
    status TEXT DEFAULT 'ACTIVE' NOT NULL,
    terms_and_conditions TEXT,
    created_by TEXT DEFAULT 'SUPER_ADMIN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP
  );
`;
