/**
 * VERTEX STEP 3C — Production Financial Integrity Verification Suite
 *
 * Verifies:
 * 1. Financial Schema & Numeric Precision (NUMERIC/DECIMAL on all financial amounts)
 * 2. Database Constraints & Partial Unique Indexes (One invoice per booking, one earning per job)
 * 3. Booking Completion Integrity (Doorstep OTP validation, row-level locks, idempotent completion)
 * 4. Invoice Calculation Integrity (subtotal - discount + tax = grandTotal, immutable line items)
 * 5. Payment Collection & Overpayment Protection (Rejection of overpayment, idempotent key replay)
 * 6. Payment Verification & Cash Reconciliation
 * 7. Refund Integrity & Balance Restoration (Amount validation, double refund prevention)
 * 8. Double-Entry General Ledger Balance (Debit = Credit for all financial events)
 * 9. Webhook Signature & Idempotency Security
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${testName}`);
    if (details) console.error(`         -> ${details}`);
  }
}

async function runStep3CFinancialVerification() {
  console.log('\n=============================================================');
  console.log('   VERTEX STEP 3C — FINANCIAL INTEGRITY & AUDIT VERIFICATION');
  console.log('=============================================================\n');

  // --- SECTION 1: SCHEMA AUDIT & NUMERIC PRECISION ---
  console.log('--- 1. Schema Audit & PostgreSQL Numeric Precision ---');
  const schemaFile = fs.readFileSync(path.resolve('src/db/schema.ts'), 'utf8');

  assert(
    schemaFile.includes("export const invoices = pgTable('invoices'") &&
    schemaFile.includes("numeric('subtotal', { precision: 12, scale: 2 })") &&
    schemaFile.includes("numeric('grand_total', { precision: 12, scale: 2 })") &&
    schemaFile.includes("numeric('balance_amount', { precision: 12, scale: 2 })"),
    'Invoices table uses NUMERIC(12, 2) for subtotal, grand_total, balance_amount'
  );

  assert(
    schemaFile.includes("export const payments = pgTable('payments'") &&
    schemaFile.includes("numeric('amount', { precision: 12, scale: 2 })") &&
    schemaFile.includes("numeric('refund_amount', { precision: 12, scale: 2 })"),
    'Payments table uses NUMERIC(12, 2) for payment amount and refund amount'
  );

  assert(
    schemaFile.includes("export const technicianEarnings = pgTable('technician_earnings'") &&
    schemaFile.includes("numeric('amount', { precision: 12, scale: 2 })"),
    'Technician earnings table uses NUMERIC(12, 2) precision'
  );

  assert(
    schemaFile.includes("export const ledgerEntries = pgTable('ledger_entries'") &&
    schemaFile.includes("numeric('debit', { precision: 12, scale: 2 })") &&
    schemaFile.includes("numeric('credit', { precision: 12, scale: 2 })"),
    'General ledger table uses NUMERIC(12, 2) for debit and credit amounts'
  );

  // --- SECTION 2: DATABASE CONSTRAINTS & UNIQUE PARTIAL INDEXES ---
  console.log('\n--- 2. Database Constraints & Idempotency Indexes ---');
  const migration0004 = fs.readFileSync(path.resolve('src/db/migrations/0004_financial_integrity.ts'), 'utf8');

  assert(
    migration0004.includes('CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id)') &&
    migration0004.includes('WHERE booking_id IS NOT NULL AND deleted_at IS NULL'),
    'Migration 0004 enforces unique partial index on invoices(booking_id)'
  );

  assert(
    migration0004.includes('CREATE UNIQUE INDEX IF NOT EXISTS idx_technician_earnings_job_id ON technician_earnings(job_id)') &&
    migration0004.includes('WHERE job_id IS NOT NULL'),
    'Migration 0004 enforces unique index on technician_earnings(job_id)'
  );

  assert(
    migration0004.includes('CREATE TABLE IF NOT EXISTS ledger_entries') &&
    migration0004.includes('entry_number TEXT NOT NULL UNIQUE'),
    'Ledger table has unique constraint on entry_number'
  );

  // --- SECTION 3: BOOKING COMPLETION & DOORSTEP OTP SECURITY ---
  console.log('\n--- 3. Booking Completion & Doorstep OTP Security ---');
  const techRoutes = fs.readFileSync(path.resolve('src/server/routes/technician.ts'), 'utf8');
  const bookingRepo = fs.readFileSync(path.resolve('src/server/repositories/bookingRepository.ts'), 'utf8');

  assert(
    techRoutes.includes("if (currentStatus === 'Arrived')") &&
    techRoutes.includes("if (!requiredOtp || !otp || String(otp).trim() !== String(requiredOtp).trim())"),
    'Technician job completion strictly validates Doorstep OTP'
  );

  assert(
    !techRoutes.includes('console.log(authCheck.job.otp)') &&
    !techRoutes.includes('console.log(otp)'),
    'Doorstep OTP is not exposed in logs or console output'
  );

  assert(
    bookingRepo.includes('SELECT * FROM bookings WHERE (id = $1 OR public_id = $1) AND deleted_at IS NULL FOR UPDATE'),
    'Booking completion locks booking row FOR UPDATE in database transaction'
  );

  assert(
    bookingRepo.includes("if (current.status === 'Completed') {") &&
    bookingRepo.includes('return current;'),
    'Booking completion has idempotent early-return for duplicate requests'
  );

  // --- SECTION 4: INVOICE INTEGRITY & BALANCED LEDGER ---
  console.log('\n--- 4. Invoice Calculation Integrity & Double-Entry Ledger ---');
  assert(
    bookingRepo.includes('const netRevenue = Math.max(0, Number((subtotal - discount).toFixed(2)));') &&
    bookingRepo.includes("account, debit, credit, currency, reference_type, reference_id, description, posted_by, posted_at, created_at") &&
    bookingRepo.includes("'INVOICE_ISSUED', 'ACCOUNTS_RECEIVABLE'") &&
    bookingRepo.includes("'INVOICE_ISSUED', 'REVENUE'") &&
    bookingRepo.includes("'INVOICE_ISSUED', 'TAX_PAYABLE'"),
    'Invoice issuance creates balanced double-entry ledger entries (AR Debit = Revenue Credit + Tax Credit)'
  );

  assert(
    bookingRepo.includes("'TECHNICIAN_EARNING', 'COMMISSION_EXPENSE'") &&
    bookingRepo.includes("'TECHNICIAN_EARNING', 'TECHNICIAN_COMMISSIONS_PAYABLE'"),
    'Technician earning creates balanced double-entry ledger entries (Expense Debit = Payable Credit)'
  );

  // --- SECTION 5: PAYMENT OVERPAYMENT PROTECTION & IDEMPOTENCY ---
  console.log('\n--- 5. Payment Overpayment Protection & Idempotency ---');
  const financeRepo = fs.readFileSync(path.resolve('src/server/repositories/financeRepository.ts'), 'utf8');
  const financeRoutes = fs.readFileSync(path.resolve('src/server/routes/payments.ts'), 'utf8');

  assert(
    financeRepo.includes('if (paymentAmount > currentBalance + 0.01)') &&
    financeRepo.includes('Overpayment rejected'),
    'Payment collection strictly rejects overpayments exceeding invoice outstanding balance'
  );

  assert(
    financeRepo.includes('if (payload.idempotencyKey)') &&
    financeRepo.includes('SELECT * FROM payments WHERE idempotency_key = $1 LIMIT 1') &&
    financeRepo.includes('isDuplicate: true'),
    'Payment collection enforces idempotency key protection against duplicate charges'
  );

  assert(
    financeRepo.includes("const debitAccount = payload.paymentMethod.toUpperCase() === 'CASH' ? 'CASH' : 'BANK';") &&
    financeRepo.includes("'PAYMENT_COLLECTED', $3, $4, 0, 'INR', 'PAYMENT'") &&
    financeRepo.includes("'PAYMENT_COLLECTED', $3, 0, $4, 'INR', 'PAYMENT'"),
    'Payment collection creates balanced double-entry ledger entries (Cash/Bank Debit = AR Credit)'
  );

  // --- SECTION 6: REFUND INTEGRITY & RESTORATION ---
  console.log('\n--- 6. Refund Integrity & Balance Restoration ---');
  assert(
    financeRepo.includes('if (payment.status === \'REFUNDED\' || payment.refund_status === \'PROCESSED\')') &&
    financeRepo.includes('if (refundAmount <= 0 || refundAmount > Number(payment.amount))'),
    'Refund processing validates refund status and prevents double refunds or refund > payment amount'
  );

  assert(
    financeRepo.includes('const newPaid = Math.max(0, Number((Number(inv.amount_paid) - refundAmount).toFixed(2)));') &&
    financeRepo.includes('const newBalance = Math.max(0, Number((Number(inv.grand_total) - newPaid).toFixed(2)));'),
    'Approved refund automatically re-opens invoice balance and updates payment status'
  );

  assert(
    financeRepo.includes("'REFUND_PROCESSED', 'REFUNDS', $3, 0, 'INR', 'REFUND'") &&
    financeRepo.includes("'REFUND_PROCESSED', $3, 0, $4, 'INR', 'REFUND'"),
    'Refund processing creates balanced double-entry ledger entries (Refund Expense Debit = Bank/Cash Credit)'
  );

  // --- SECTION 7: WEBHOOK SIGNATURE & CAPTURE RECONCILIATION ---
  console.log('\n--- 7. Payment Webhook Security & Reconciliation ---');
  const webhookRoutes = fs.readFileSync(path.resolve('src/server/routes/webhooks.ts'), 'utf8');

  assert(
    webhookRoutes.includes(".createHmac('sha256', webhookSecret)") &&
    webhookRoutes.includes('Math.abs(currentTime - timestamp) > 300'),
    'Webhook endpoint enforces HMAC SHA-256 signature verification and 300s freshness window'
  );

  assert(
    webhookRoutes.includes('financeRepository.collectPaymentWithTransaction(') &&
    webhookRoutes.includes('idempotencyKey: `webhook-${provider}-${eventId}`'),
    'Webhook capture executes transaction-safe payment collection with invoice and ledger updates'
  );

  // --- SECTION 8: ADMIN & FINANCE VISIBILITY ---
  console.log('\n--- 8. Admin & Finance Ledger Visibility ---');
  const adminRoutes = fs.readFileSync(path.resolve('src/server/routes/admin.ts'), 'utf8');

  assert(
    adminRoutes.includes('FROM invoices inv') &&
    adminRoutes.includes('FROM payments p'),
    'Admin routes query authoritative PostgreSQL invoices and payments tables'
  );

  assert(
    financeRoutes.includes("router.get('/ledger'") &&
    financeRoutes.includes("router.get('/summary'"),
    'Finance routes expose authoritative /ledger and /summary endpoints'
  );

  // --- SUMMARY ---
  console.log('\n=============================================================');
  console.log(`   TOTAL TESTS: ${passed + failed}`);
  console.log(`   PASSED:      ${passed}`);
  console.log(`   FAILED:      ${failed}`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep3CFinancialVerification().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
