/**
 * 0004_financial_integrity.ts
 * Step 3C: Production Financial Integrity, Ledger, and Constraint Hardening.
 * Strict backward compatibility & zero-downtime:
 * - NO table drops
 * - NO column drops
 * - Idempotent CREATE TABLE IF NOT EXISTS
 * - Idempotent CREATE UNIQUE INDEX IF NOT EXISTS
 */
export const migration_0004_financial = `
  -- 1. Financial Ledger Table for Auditable Double-Entry & Financial Tracking
  CREATE TABLE IF NOT EXISTS ledger_entries (
    id TEXT PRIMARY KEY,
    entry_number TEXT NOT NULL UNIQUE,
    entry_type TEXT NOT NULL,
    account TEXT NOT NULL,
    debit NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    credit NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    currency TEXT DEFAULT 'INR' NOT NULL,
    reference_type TEXT NOT NULL,
    reference_id TEXT NOT NULL,
    description TEXT,
    posted_by TEXT,
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  -- 2. Indexes for Ledger Lookups
  CREATE INDEX IF NOT EXISTS idx_ledger_entries_reference ON ledger_entries(reference_type, reference_id);
  CREATE INDEX IF NOT EXISTS idx_ledger_entries_account ON ledger_entries(account);
  CREATE INDEX IF NOT EXISTS idx_ledger_entries_posted_at ON ledger_entries(posted_at DESC);

  -- 3. Idempotency & Financial Uniqueness Constraints
  -- Prevent multiple active invoices per booking
  CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id)
    WHERE booking_id IS NOT NULL AND deleted_at IS NULL;

  -- Prevent duplicate technician earnings per completed job
  CREATE UNIQUE INDEX IF NOT EXISTS idx_technician_earnings_job_id ON technician_earnings(job_id)
    WHERE job_id IS NOT NULL;

  -- Performance index for payment queries by booking
  CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id)
    WHERE booking_id IS NOT NULL;

  -- Performance index for invoices by customer
  CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id)
    WHERE deleted_at IS NULL;
`;
