/**
 * 0002_production_tables.sql
 * Step 2B: Additive, Zero-Downtime Migration for all mission-critical production tables.
 * Strict backward compatibility:
 * - NO table drops
 * - NO column drops
 * - Idempotent CREATE TABLE IF NOT EXISTS
 * - Preserves monetary precision via NUMERIC(12,2)
 * - Safe foreign keys and unconstrained indexes
 */
export const migration_0002_production = `
  -- =========================================================================
  -- 1. SERVICE CATALOG: CATEGORIES & SERVICES
  -- =========================================================================
  CREATE TABLE IF NOT EXISTS service_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT UNIQUE,
    code TEXT UNIQUE,
    description TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 1 NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    public_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    category_id INTEGER NOT NULL REFERENCES service_categories(id),
    category_name TEXT,
    description TEXT,
    short_description TEXT,
    price NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    base_price NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    discounted_price NUMERIC(12, 2),
    strike_price NUMERIC(12, 2),
    duration_minutes INTEGER DEFAULT 60 NOT NULL,
    warranty_days INTEGER DEFAULT 30 NOT NULL,
    sla_hours INTEGER DEFAULT 4 NOT NULL,
    tax_percent NUMERIC(5, 2) DEFAULT 18.00 NOT NULL,
    image_url TEXT,
    status TEXT DEFAULT 'ACTIVE' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    sort_order INTEGER DEFAULT 1 NOT NULL,
    features TEXT, -- JSON array string
    availability TEXT, -- JSON array string
    requirements TEXT, -- JSON array string
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP
  );

  -- =========================================================================
  -- 2. CUSTOMER DATA: ADDRESSES (With historical integrity)
  -- =========================================================================
  CREATE TABLE IF NOT EXISTS addresses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label TEXT DEFAULT 'Home' NOT NULL,
    address_line_1 TEXT NOT NULL,
    address_line_2 TEXT,
    city TEXT DEFAULT 'Gurgaon' NOT NULL,
    state TEXT DEFAULT 'Haryana' NOT NULL,
    postal_code TEXT DEFAULT '122001' NOT NULL,
    latitude REAL,
    longitude REAL,
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
  );

  -- =========================================================================
  -- 3. BOOKINGS & COMPLETE LIFECYCLE
  -- =========================================================================
  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    public_id TEXT NOT NULL UNIQUE,
    customer_id TEXT NOT NULL REFERENCES users(id),
    service_id TEXT REFERENCES services(id),
    service_name TEXT,
    service_category TEXT,
    technician_id TEXT REFERENCES users(id),
    technician_name TEXT,
    technician_phone TEXT,
    scheduled_date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    service_address TEXT NOT NULL,
    service_address_snapshot JSONB, -- Immutable snapshot preserving exact historical booking address
    service_price_snapshot NUMERIC(12, 2), -- Immutable historical price charged
    total_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    technician_cut NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    status TEXT DEFAULT 'Pending' NOT NULL,
    payment_status TEXT DEFAULT 'PENDING' NOT NULL,
    otp TEXT,
    notes TEXT,
    instructions TEXT,
    work_performed TEXT,
    parts_used TEXT,
    technician_notes TEXT,
    customer_remarks TEXT,
    cancellation_reason TEXT,
    cancelled_by TEXT,
    cancelled_at TIMESTAMP,
    rescheduled_from TEXT,
    rescheduled_at TIMESTAMP,
    completed_at TIMESTAMP,
    city_id INTEGER REFERENCES cities(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS booking_items (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    service_id TEXT REFERENCES services(id),
    service_name TEXT NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE TABLE IF NOT EXISTS booking_status_history (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT REFERENCES users(id),
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  -- =========================================================================
  -- 4. INVOICES & BILLING
  -- =========================================================================
  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL UNIQUE,
    booking_id TEXT REFERENCES bookings(id),
    customer_id TEXT NOT NULL REFERENCES users(id),
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    billing_address TEXT,
    subtotal NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    grand_total NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    amount_paid NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    balance_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    currency TEXT DEFAULT 'INR' NOT NULL,
    status TEXT DEFAULT 'ISSUED' NOT NULL, -- DRAFT | ISSUED | PARTIALLY_PAID | PAID | VOID | REFUNDED
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    due_date DATE,
    paid_at TIMESTAMP,
    pdf_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    tax_rate NUMERIC(5, 2) DEFAULT 18.00 NOT NULL,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  -- =========================================================================
  -- 5. PAYMENT WEBHOOK EVENTS & IDEMPOTENCY
  -- =========================================================================
  CREATE TABLE IF NOT EXISTS payment_webhook_events (
    id TEXT PRIMARY KEY,
    provider TEXT DEFAULT 'RAZORPAY' NOT NULL,
    event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB,
    status TEXT DEFAULT 'PROCESSED' NOT NULL,
    error_message TEXT,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_provider_event UNIQUE (provider, event_id)
  );

  -- =========================================================================
  -- 6. AMC CONTRACTS & ENTITLEMENTS
  -- =========================================================================
  CREATE TABLE IF NOT EXISTS amc_plans (
    id TEXT PRIMARY KEY,
    public_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    slug TEXT UNIQUE,
    description TEXT,
    duration_months INTEGER DEFAULT 12 NOT NULL,
    price NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    base_price NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    strike_price NUMERIC(12, 2),
    tax_percent NUMERIC(5, 2) DEFAULT 18.00 NOT NULL,
    preventive_visits INTEGER DEFAULT 3 NOT NULL,
    breakdown_visits INTEGER DEFAULT 99 NOT NULL,
    spare_parts_discount_percent NUMERIC(5, 2) DEFAULT 15.00 NOT NULL,
    gas_charging_included BOOLEAN DEFAULT FALSE NOT NULL,
    priority_sla_hours INTEGER DEFAULT 4 NOT NULL,
    included_services TEXT, -- JSON array string
    visit_frequency TEXT,
    benefits TEXT, -- JSON array string
    exclusions TEXT, -- JSON array string
    terms TEXT,
    status TEXT DEFAULT 'ACTIVE' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    sort_order INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS amc_subscriptions (
    id TEXT PRIMARY KEY,
    public_id TEXT NOT NULL UNIQUE,
    customer_id TEXT NOT NULL REFERENCES users(id),
    plan_id TEXT NOT NULL REFERENCES amc_plans(id),
    plan_name TEXT NOT NULL,
    plan_price_snapshot NUMERIC(12, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'ACTIVE' NOT NULL, -- ACTIVE | EXPIRED | CANCELLED | PENDING_RENEWAL
    total_preventive_visits INTEGER DEFAULT 3 NOT NULL,
    used_preventive_visits INTEGER DEFAULT 0 NOT NULL,
    total_breakdown_visits INTEGER DEFAULT 99 NOT NULL,
    used_breakdown_visits INTEGER DEFAULT 0 NOT NULL,
    payment_status TEXT DEFAULT 'PAID' NOT NULL,
    covered_appliances TEXT,
    service_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP
  );

  -- =========================================================================
  -- 7. PARTNERS & CHANNEL COMMISSIONS
  -- =========================================================================
  CREATE TABLE IF NOT EXISTS partners (
    id TEXT PRIMARY KEY,
    public_id TEXT NOT NULL UNIQUE,
    user_id TEXT REFERENCES users(id),
    company_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE' NOT NULL,
    address TEXT,
    city_id INTEGER REFERENCES cities(id),
    city_name TEXT,
    commission_type TEXT DEFAULT 'PERCENTAGE' NOT NULL,
    default_rate NUMERIC(5, 2) DEFAULT 10.00 NOT NULL,
    tier TEXT DEFAULT 'STANDARD' NOT NULL,
    pan_number TEXT,
    gst_number TEXT,
    bank_account_number TEXT,
    bank_ifsc TEXT,
    bank_name TEXT,
    total_referrals INTEGER DEFAULT 0 NOT NULL,
    total_commission_earned NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    total_commission_paid NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS commission_rules (
    id TEXT PRIMARY KEY,
    version INTEGER DEFAULT 1 NOT NULL,
    rule_name TEXT NOT NULL,
    rule_type TEXT DEFAULT 'PERCENTAGE' NOT NULL,
    service_id TEXT REFERENCES services(id),
    category_id INTEGER REFERENCES service_categories(id),
    rate_value NUMERIC(5, 2) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    status TEXT DEFAULT 'ACTIVE' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS partner_commissions (
    id TEXT PRIMARY KEY,
    public_id TEXT NOT NULL UNIQUE,
    partner_id TEXT NOT NULL REFERENCES partners(id),
    partner_name TEXT NOT NULL,
    booking_id TEXT REFERENCES bookings(id),
    service_name TEXT,
    base_amount NUMERIC(12, 2) NOT NULL,
    commission_amount NUMERIC(12, 2) NOT NULL,
    status TEXT DEFAULT 'PENDING' NOT NULL, -- PENDING | APPROVED | PAID | REJECTED
    approved_by TEXT,
    approved_at TIMESTAMP,
    paid_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  -- =========================================================================
  -- 8. TECHNICIAN FLEET OPERATIONS: ATTENDANCE, EARNINGS, NOTIFICATIONS
  -- =========================================================================
  CREATE TABLE IF NOT EXISTS technician_attendance (
    id TEXT PRIMARY KEY,
    technician_id TEXT NOT NULL REFERENCES users(id),
    date DATE NOT NULL,
    day TEXT,
    punch_in TIMESTAMP NOT NULL,
    punch_out TIMESTAMP,
    duration_hours NUMERIC(4, 2) DEFAULT 0.00 NOT NULL,
    status TEXT DEFAULT 'PRESENT' NOT NULL, -- PRESENT | HALF_DAY | OFF | LEAVE
    hub TEXT DEFAULT 'Gurgaon Central' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE TABLE IF NOT EXISTS technician_earnings (
    id TEXT PRIMARY KEY,
    technician_id TEXT NOT NULL REFERENCES users(id),
    job_id TEXT REFERENCES bookings(id),
    service TEXT NOT NULL,
    customer TEXT NOT NULL,
    date DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    status TEXT DEFAULT 'Settled' NOT NULL, -- Settled | Processing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE TABLE IF NOT EXISTS technician_notifications (
    id TEXT PRIMARY KEY,
    technician_id TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    desc_text TEXT NOT NULL,
    time_text TEXT,
    type TEXT DEFAULT 'job' NOT NULL, -- job | rating | payout | system
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE TABLE IF NOT EXISTS customer_notifications (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'booking' NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  -- =========================================================================
  -- 9. SUPPORT & REVIEWS
  -- =========================================================================
  CREATE TABLE IF NOT EXISTS support_tickets (
    id TEXT PRIMARY KEY,
    ticket_code TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL REFERENCES users(id),
    booking_id TEXT REFERENCES bookings(id),
    subject TEXT NOT NULL,
    category TEXT DEFAULT 'GENERAL' NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN' NOT NULL, -- OPEN | IN_PROGRESS | RESOLVED | CLOSED
    priority TEXT DEFAULT 'MEDIUM' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL REFERENCES bookings(id),
    customer_id TEXT NOT NULL REFERENCES users(id),
    technician_id TEXT REFERENCES users(id),
    rating NUMERIC(2, 1) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  -- =========================================================================
  -- 10. FILE UPLOADS METADATA
  -- =========================================================================
  CREATE TABLE IF NOT EXISTS file_uploads (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    user_role TEXT NOT NULL,
    category TEXT NOT NULL,
    entity_id TEXT,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    storage_provider TEXT DEFAULT 'LOCAL_SECURE' NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  -- =========================================================================
  -- 11. HR & PAYROLL (BUSINESS HUB ONLY)
  -- =========================================================================
  CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    manager_id TEXT,
    manager_name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS designations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    code TEXT,
    department_id TEXT NOT NULL REFERENCES departments(id),
    level TEXT DEFAULT 'L3' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    grace_period_mins INTEGER DEFAULT 15 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    employee_code TEXT NOT NULL UNIQUE,
    user_id TEXT REFERENCES users(id),
    first_name TEXT,
    last_name TEXT,
    full_name TEXT NOT NULL,
    personal_email TEXT,
    work_email TEXT,
    phone TEXT NOT NULL,
    dob DATE,
    gender TEXT,
    address JSONB,
    emergency_contact JSONB,
    joining_date DATE,
    employment_status TEXT DEFAULT 'ACTIVE' NOT NULL,
    department_id TEXT NOT NULL REFERENCES departments(id),
    designation_id TEXT NOT NULL REFERENCES designations(id),
    shift_id TEXT REFERENCES shifts(id),
    work_location TEXT,
    employment_type TEXT DEFAULT 'FULL_TIME' NOT NULL,
    bank_account_number TEXT,
    bank_name TEXT,
    bank_ifsc TEXT,
    pan_number TEXT,
    monthly_ctc NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS employee_attendance (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL REFERENCES employees(id),
    date DATE NOT NULL,
    status TEXT DEFAULT 'PRESENT' NOT NULL,
    punch_in TIMESTAMP,
    punch_out TIMESTAMP,
    work_hours NUMERIC(4, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE TABLE IF NOT EXISTS leave_types (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    yearly_quota INTEGER DEFAULT 12 NOT NULL,
    is_carry_forward BOOLEAN DEFAULT FALSE NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS leave_balances (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    leave_type_code TEXT NOT NULL REFERENCES leave_types(code),
    total_allocated INTEGER DEFAULT 12 NOT NULL,
    used_days INTEGER DEFAULT 0 NOT NULL,
    balance_days INTEGER DEFAULT 12 NOT NULL
  );

  CREATE TABLE IF NOT EXISTS leave_requests (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    leave_type_code TEXT NOT NULL REFERENCES leave_types(code),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING' NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE TABLE IF NOT EXISTS holidays (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    date DATE NOT NULL UNIQUE,
    day TEXT,
    is_optional BOOLEAN DEFAULT FALSE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS salary_structures (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    version INTEGER DEFAULT 1 NOT NULL,
    effective_from DATE NOT NULL,
    basic_percent NUMERIC(5, 2) DEFAULT 50.00 NOT NULL,
    hra_percent NUMERIC(5, 2) DEFAULT 20.00 NOT NULL,
    special_allowance_percent NUMERIC(5, 2) DEFAULT 30.00 NOT NULL,
    pf_employee_rate NUMERIC(5, 2) DEFAULT 12.00 NOT NULL,
    esi_employee_rate NUMERIC(5, 2) DEFAULT 0.75 NOT NULL,
    pt_monthly NUMERIC(10, 2) DEFAULT 200.00 NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE TABLE IF NOT EXISTS payroll_runs (
    id TEXT PRIMARY KEY,
    public_id TEXT NOT NULL UNIQUE,
    month_year TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'DRAFT' NOT NULL, -- DRAFT | FINALIZED | REOPENED
    total_gross NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    total_deductions NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    total_net NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    employee_count INTEGER DEFAULT 0 NOT NULL,
    processed_by TEXT,
    processed_at TIMESTAMP,
    approved_by TEXT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE TABLE IF NOT EXISTS payslips (
    id TEXT PRIMARY KEY,
    public_id TEXT NOT NULL UNIQUE,
    payroll_run_id TEXT NOT NULL REFERENCES payroll_runs(id),
    employee_id TEXT NOT NULL,
    employee_code TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    month_year TEXT NOT NULL,
    days_in_month INTEGER DEFAULT 30 NOT NULL,
    payable_days INTEGER DEFAULT 30 NOT NULL,
    earnings JSONB NOT NULL,
    deductions JSONB NOT NULL,
    net_salary NUMERIC(12, 2) NOT NULL,
    status TEXT DEFAULT 'PUBLISHED' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );
`;
