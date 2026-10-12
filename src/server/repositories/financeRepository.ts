import crypto from 'crypto';
import { BaseRepository, DatabaseTransactionContext } from './baseRepository.js';

export interface PaymentEntity {
  id: string;
  public_id: string;
  booking_id: string | null;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  amount: number | string;
  currency: string;
  payment_method: string;
  payment_reference: string | null;
  status: string;
  collected_by: string;
  collected_by_name: string;
  collected_at: string;
  notes: string | null;
  receipt_number: string | null;
  verified_by: string | null;
  verified_at: string | null;
  refund_reason: string | null;
  refund_status: string;
  refund_amount: number | string | null;
  refund_approved_by: string | null;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceEntity {
  id: string;
  invoice_number: string;
  booking_id: string | null;
  customer_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  billing_address: string | null;
  subtotal: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  grand_total: number | string;
  amount_paid: number | string;
  balance_amount: number | string;
  currency: string;
  status: string;
  issued_at: string;
  due_date: string | null;
  paid_at: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface InvoiceItemEntity {
  id: string;
  invoice_id: string;
  description: string;
  unit_price: number | string;
  quantity: number;
  tax_rate: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  created_at: string;
}

export interface LedgerEntryEntity {
  id: string;
  entry_number: string;
  entry_type: string;
  account: string;
  debit: number | string;
  credit: number | string;
  currency: string;
  reference_type: string;
  reference_id: string;
  description: string | null;
  posted_by: string | null;
  posted_at: string;
  created_at: string;
}

export class FinanceRepository extends BaseRepository {
  async listPayments(options: {
    status?: string;
    method?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ payments: PaymentEntity[]; total: number }> {
    const client = await this.getClient();
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (options.status && options.status !== 'ALL') {
      params.push(options.status);
      whereClause += ` AND UPPER(status) = UPPER($${params.length})`;
    }

    if (options.method && options.method !== 'ALL') {
      params.push(options.method);
      whereClause += ` AND UPPER(payment_method) = UPPER($${params.length})`;
    }

    if (options.search) {
      params.push(`%${options.search.toLowerCase()}%`);
      const idx = params.length;
      whereClause += ` AND (LOWER(public_id) LIKE $${idx} OR LOWER(COALESCE(booking_id, '')) LIKE $${idx} OR LOWER(customer_name) LIKE $${idx} OR LOWER(COALESCE(payment_reference, '')) LIKE $${idx} OR LOWER(COALESCE(receipt_number, '')) LIKE $${idx})`;
    }

    const countRes = await client.query<{ count: string }>(`SELECT COUNT(*) as count FROM payments ${whereClause}`, params);
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    let querySql = `SELECT * FROM payments ${whereClause} ORDER BY collected_at DESC`;
    if (options.limit) {
      params.push(options.limit);
      querySql += ` LIMIT $${params.length}`;
    }
    if (options.offset) {
      params.push(options.offset);
      querySql += ` OFFSET $${params.length}`;
    }

    const res = await client.query<PaymentEntity>(querySql, params);
    return { payments: res.rows, total };
  }

  async getPaymentById(id: string, tx?: DatabaseTransactionContext): Promise<PaymentEntity | null> {
    const queryFn = tx ? tx.query : (await this.getClient()).query;
    const res = await queryFn<PaymentEntity>(
      `SELECT * FROM payments WHERE id = $1 OR public_id = $1 LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async recordPayment(data: Partial<PaymentEntity>, tx?: DatabaseTransactionContext): Promise<PaymentEntity> {
    const queryFn = tx ? tx.query : (await this.getClient()).query;
    const res = await queryFn<PaymentEntity>(
      `INSERT INTO payments (
         id, public_id, booking_id, customer_id, customer_name, customer_phone,
         amount, currency, payment_method, payment_reference, status,
         collected_by, collected_by_name, collected_at, notes, receipt_number,
         idempotency_key, created_at, updated_at
       )
       VALUES (
         $1, $2, $3, $4, $5, $6,
         $7, $8, $9, $10, $11,
         $12, $13, CURRENT_TIMESTAMP, $14, $15,
         $16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
       )
       RETURNING *`,
      [
        data.id,
        data.public_id,
        data.booking_id || null,
        data.customer_id || null,
        data.customer_name,
        data.customer_phone || null,
        data.amount,
        data.currency || 'INR',
        data.payment_method,
        data.payment_reference || null,
        data.status || 'COLLECTED',
        data.collected_by,
        data.collected_by_name,
        data.notes || null,
        data.receipt_number || null,
        data.idempotency_key || null,
      ]
    );
    return res.rows[0];
  }

  /**
   * Transactional and Idempotent Payment Collection:
   * 1. Validates amount and locks invoice row FOR UPDATE to prevent concurrent overpayments
   * 2. Inserts payment record
   * 3. Updates invoice amount_paid, balance_amount, and status
   * 4. Updates booking payment_status
   * 5. Generates double-entry ledger entries (Debit: CASH/BANK, Credit: ACCOUNTS_RECEIVABLE)
   */
  async collectPaymentWithTransaction(payload: {
    bookingId?: string;
    invoiceId?: string;
    customerId?: string;
    customerName: string;
    customerPhone?: string;
    amount: number;
    paymentMethod: string;
    paymentReference?: string;
    collectedBy: string;
    collectedByName: string;
    notes?: string;
    idempotencyKey?: string;
  }): Promise<{ payment: PaymentEntity; invoice?: InvoiceEntity | null; isDuplicate?: boolean }> {
    return await this.withTransaction(async (tx) => {
      // 1. Idempotency Check
      if (payload.idempotencyKey) {
        const existingPay = await tx.query<PaymentEntity>(
          `SELECT * FROM payments WHERE idempotency_key = $1 LIMIT 1`,
          [payload.idempotencyKey]
        );
        if (existingPay.rows.length > 0) {
          return { payment: existingPay.rows[0], isDuplicate: true };
        }
      }

      const paymentAmount = Number(payload.amount);
      if (paymentAmount <= 0) {
        throw new Error('Payment amount must be greater than zero.');
      }

      // 2. Locate and Lock Associated Invoice FOR UPDATE (if any)
      let matchedInvoice: InvoiceEntity | null = null;
      if (payload.invoiceId || payload.bookingId) {
        const invQuery = payload.invoiceId
          ? `SELECT * FROM invoices WHERE (id = $1 OR invoice_number = $1) AND deleted_at IS NULL FOR UPDATE`
          : `SELECT * FROM invoices WHERE booking_id = $1 AND deleted_at IS NULL FOR UPDATE`;
        const invParam = payload.invoiceId || payload.bookingId;
        const invRes = await tx.query<InvoiceEntity>(invQuery, [invParam]);
        if (invRes.rows.length > 0) {
          matchedInvoice = invRes.rows[0];
        }
      }

      // Validate overpayment protection if invoice is found
      if (matchedInvoice) {
        const currentBalance = Number(matchedInvoice.balance_amount);
        if (paymentAmount > currentBalance + 0.01) { // 0.01 tolerance for minor rounding
          throw new Error(
            `Payment amount (₹${paymentAmount}) exceeds invoice outstanding balance (₹${currentBalance}). Overpayment rejected.`
          );
        }
      }

      // 3. Insert Payment Record
      const paymentId = `pay-${crypto.randomUUID()}`;
      const publicSuffix = Math.floor(1000 + Math.random() * 9000);
      const publicId = `PAY-${publicSuffix}`;
      const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;

      const payment = await this.recordPayment(
        {
          id: paymentId,
          public_id: publicId,
          booking_id: payload.bookingId || matchedInvoice?.booking_id || null,
          customer_id: payload.customerId || matchedInvoice?.customer_id || null,
          customer_name: payload.customerName || matchedInvoice?.customer_name || 'Customer',
          customer_phone: payload.customerPhone || matchedInvoice?.customer_phone || null,
          amount: paymentAmount,
          currency: 'INR',
          payment_method: payload.paymentMethod.toUpperCase(),
          payment_reference: payload.paymentReference || null,
          status: 'COLLECTED',
          collected_by: payload.collectedBy,
          collected_by_name: payload.collectedByName,
          notes: payload.notes || null,
          receipt_number: receiptNumber,
          idempotency_key: payload.idempotencyKey || null,
        },
        tx
      );

      // 4. Update Invoice Balance & Status
      let updatedInvoice: InvoiceEntity | null = null;
      if (matchedInvoice) {
        const previousPaid = Number(matchedInvoice.amount_paid) || 0;
        const grandTotal = Number(matchedInvoice.grand_total) || 0;
        const newPaid = Number((previousPaid + paymentAmount).toFixed(2));
        const newBalance = Math.max(0, Number((grandTotal - newPaid).toFixed(2)));
        const newStatus = newBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';

        const invUpdateRes = await tx.query<InvoiceEntity>(
          `UPDATE invoices
           SET amount_paid = $1,
               balance_amount = $2,
               status = $3,
               paid_at = CASE WHEN $3 = 'PAID' THEN CURRENT_TIMESTAMP ELSE paid_at END,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $4
           RETURNING *`,
          [newPaid, newBalance, newStatus, matchedInvoice.id]
        );
        updatedInvoice = invUpdateRes.rows[0];
      }

      // 5. Update Booking Payment Status
      const targetBookingId = payload.bookingId || matchedInvoice?.booking_id;
      if (targetBookingId) {
        const isFullyPaid = updatedInvoice ? updatedInvoice.status === 'PAID' : true;
        await tx.query(
          `UPDATE bookings
           SET payment_status = $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 OR public_id = $2`,
          [isFullyPaid ? 'PAID' : 'PARTIALLY_PAID', targetBookingId]
        );
      }

      // 6. Post Double-Entry General Ledger Records
      // Debit: Cash or Bank Account (Asset increases)
      const debitAccount = payload.paymentMethod.toUpperCase() === 'CASH' ? 'CASH' : 'BANK';
      await tx.query(
        `INSERT INTO ledger_entries (
           id, entry_number, entry_type, account, debit, credit, currency,
           reference_type, reference_id, description, posted_by, posted_at, created_at
         )
         VALUES ($1, $2, 'PAYMENT_COLLECTED', $3, $4, 0, 'INR', 'PAYMENT', $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          `ldg-${crypto.randomUUID()}`,
          `TXN-${Date.now()}-PAY-DR`,
          debitAccount,
          paymentAmount,
          payment.id,
          `Payment ${payment.public_id} collected via ${payload.paymentMethod}`,
          payload.collectedBy,
        ]
      );

      // Credit: Accounts Receivable (or Customer Advance if not yet invoiced)
      const creditAccount = matchedInvoice ? 'ACCOUNTS_RECEIVABLE' : 'CUSTOMER_ADVANCE';
      await tx.query(
        `INSERT INTO ledger_entries (
           id, entry_number, entry_type, account, debit, credit, currency,
           reference_type, reference_id, description, posted_by, posted_at, created_at
         )
         VALUES ($1, $2, 'PAYMENT_COLLECTED', $3, 0, $4, 'INR', 'PAYMENT', $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          `ldg-${crypto.randomUUID()}`,
          `TXN-${Date.now()}-PAY-CR`,
          creditAccount,
          paymentAmount,
          payment.id,
          `Receivable cleared for payment ${payment.public_id}`,
          payload.collectedBy,
        ]
      );

      return { payment, invoice: updatedInvoice };
    });
  }

  /**
   * Transactional Payment Verification & Reconciliation
   */
  async verifyPaymentWithTransaction(id: string, verifiedBy: string): Promise<PaymentEntity> {
    return await this.withTransaction(async (tx) => {
      const lockRes = await tx.query<PaymentEntity>(
        `SELECT * FROM payments WHERE (id = $1 OR public_id = $1) FOR UPDATE`,
        [id]
      );
      if (lockRes.rows.length === 0) {
        throw new Error(`Payment '${id}' not found.`);
      }

      const payment = lockRes.rows[0];
      if (payment.status === 'VERIFIED') {
        return payment; // Idempotent return
      }

      const updateRes = await tx.query<PaymentEntity>(
        `UPDATE payments
         SET status = 'VERIFIED',
             verified_by = $1,
             verified_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [verifiedBy, payment.id]
      );

      // If payment was in Cash, log reconciliation entry into ledger
      if (payment.payment_method === 'CASH') {
        const amount = Number(payment.amount);
        await tx.query(
          `INSERT INTO ledger_entries (
             id, entry_number, entry_type, account, debit, credit, currency,
             reference_type, reference_id, description, posted_by, posted_at, created_at
           )
           VALUES ($1, $2, 'PAYMENT_VERIFIED', 'BANK', $3, 0, 'INR', 'PAYMENT', $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            `ldg-${crypto.randomUUID()}`,
            `TXN-${Date.now()}-REC-DR`,
            amount,
            payment.id,
            `Cash deposit reconciled to bank for payment ${payment.public_id}`,
            verifiedBy,
          ]
        );
        await tx.query(
          `INSERT INTO ledger_entries (
             id, entry_number, entry_type, account, debit, credit, currency,
             reference_type, reference_id, description, posted_by, posted_at, created_at
           )
           VALUES ($1, $2, 'PAYMENT_VERIFIED', 'CASH', 0, $3, 'INR', 'PAYMENT', $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            `ldg-${crypto.randomUUID()}`,
            `TXN-${Date.now()}-REC-CR`,
            amount,
            payment.id,
            `Cash in transit cleared for payment ${payment.public_id}`,
            verifiedBy,
          ]
        );
      }

      return updateRes.rows[0];
    });
  }

  async requestRefund(id: string, refundAmount: number, reason: string): Promise<PaymentEntity | null> {
    const client = await this.getClient();
    const res = await client.query<PaymentEntity>(
      `UPDATE payments
       SET refund_status = 'REQUESTED',
           refund_amount = $1,
           refund_reason = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE (id = $3 OR public_id = $3)
       RETURNING *`,
      [refundAmount, reason, id]
    );
    return res.rows[0] || null;
  }

  /**
   * Transactional and Idempotent Refund Processing:
   * 1. Locks payment FOR UPDATE and validates status
   * 2. Marks payment as REFUNDED
   * 3. Re-opens or adjusts associated invoice balance
   * 4. Updates booking payment status
   * 5. Posts double-entry ledger entries (Debit: REFUNDS, Credit: BANK/CASH)
   */
  async approveRefundWithTransaction(id: string, approvedBy: string): Promise<PaymentEntity> {
    return await this.withTransaction(async (tx) => {
      const lockRes = await tx.query<PaymentEntity>(
        `SELECT * FROM payments WHERE (id = $1 OR public_id = $1) FOR UPDATE`,
        [id]
      );
      if (lockRes.rows.length === 0) {
        throw new Error(`Payment '${id}' not found.`);
      }

      const payment = lockRes.rows[0];
      if (payment.status === 'REFUNDED' || payment.refund_status === 'PROCESSED') {
        return payment; // Idempotent return
      }

      const refundAmount = Number(payment.refund_amount) || Number(payment.amount);
      if (refundAmount <= 0 || refundAmount > Number(payment.amount)) {
        throw new Error(`Invalid refund amount ₹${refundAmount}. Cannot exceed payment amount ₹${payment.amount}.`);
      }

      const updateRes = await tx.query<PaymentEntity>(
        `UPDATE payments
         SET status = 'REFUNDED',
             refund_status = 'PROCESSED',
             refund_amount = $1,
             refund_approved_by = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [refundAmount, approvedBy, payment.id]
      );

      // Adjust associated invoice if exists
      if (payment.booking_id) {
        const invRes = await tx.query<InvoiceEntity>(
          `SELECT * FROM invoices WHERE booking_id = $1 AND deleted_at IS NULL FOR UPDATE`,
          [payment.booking_id]
        );
        if (invRes.rows.length > 0) {
          const inv = invRes.rows[0];
          const newPaid = Math.max(0, Number((Number(inv.amount_paid) - refundAmount).toFixed(2)));
          const newBalance = Math.max(0, Number((Number(inv.grand_total) - newPaid).toFixed(2)));
          const newStatus = newPaid === 0 ? 'ISSUED' : 'PARTIALLY_PAID';

          await tx.query(
            `UPDATE invoices
             SET amount_paid = $1,
                 balance_amount = $2,
                 status = $3,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [newPaid, newBalance, newStatus, inv.id]
          );
        }

        // Update booking payment status
        await tx.query(
          `UPDATE bookings
           SET payment_status = 'REFUNDED',
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [payment.booking_id]
        );
      }

      // Post Double-Entry Ledger Entries
      const creditAccount = payment.payment_method.toUpperCase() === 'CASH' ? 'CASH' : 'BANK';
      // Debit: REFUNDS (Expense/Contra-Revenue increases)
      await tx.query(
        `INSERT INTO ledger_entries (
           id, entry_number, entry_type, account, debit, credit, currency,
           reference_type, reference_id, description, posted_by, posted_at, created_at
         )
         VALUES ($1, $2, 'REFUND_PROCESSED', 'REFUNDS', $3, 0, 'INR', 'REFUND', $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          `ldg-${crypto.randomUUID()}`,
          `TXN-${Date.now()}-REF-DR`,
          refundAmount,
          payment.id,
          `Refund processed for payment ${payment.public_id}: ${payment.refund_reason || 'Approved refund'}`,
          approvedBy,
        ]
      );

      // Credit: Cash or Bank (Asset decreases)
      await tx.query(
        `INSERT INTO ledger_entries (
           id, entry_number, entry_type, account, debit, credit, currency,
           reference_type, reference_id, description, posted_by, posted_at, created_at
         )
         VALUES ($1, $2, 'REFUND_PROCESSED', $3, 0, $4, 'INR', 'REFUND', $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          `ldg-${crypto.randomUUID()}`,
          `TXN-${Date.now()}-REF-CR`,
          creditAccount,
          refundAmount,
          payment.id,
          `Funds disbursed for refund on payment ${payment.public_id}`,
          approvedBy,
        ]
      );

      return updateRes.rows[0];
    });
  }

  async listInvoices(options: {
    customerId?: string;
    bookingId?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ invoices: InvoiceEntity[]; total: number }> {
    const client = await this.getClient();
    let whereClause = `WHERE deleted_at IS NULL`;
    const params: any[] = [];

    if (options.customerId) {
      params.push(options.customerId);
      whereClause += ` AND customer_id = $${params.length}`;
    }
    if (options.bookingId) {
      params.push(options.bookingId);
      whereClause += ` AND booking_id = $${params.length}`;
    }
    if (options.status && options.status !== 'ALL') {
      params.push(options.status);
      whereClause += ` AND UPPER(status) = UPPER($${params.length})`;
    }
    if (options.search) {
      params.push(`%${options.search.toLowerCase()}%`);
      const idx = params.length;
      whereClause += ` AND (LOWER(invoice_number) LIKE $${idx} OR LOWER(customer_name) LIKE $${idx} OR LOWER(COALESCE(customer_phone, '')) LIKE $${idx})`;
    }

    const countRes = await client.query<{ count: string }>(`SELECT COUNT(*) as count FROM invoices ${whereClause}`, params);
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    let sql = `SELECT * FROM invoices ${whereClause} ORDER BY issued_at DESC`;
    if (options.limit) {
      params.push(options.limit);
      sql += ` LIMIT $${params.length}`;
    }
    if (options.offset) {
      params.push(options.offset);
      sql += ` OFFSET $${params.length}`;
    }

    const res = await client.query<InvoiceEntity>(sql, params);
    return { invoices: res.rows, total };
  }

  async getInvoiceById(id: string): Promise<InvoiceEntity | null> {
    const client = await this.getClient();
    const res = await client.query<InvoiceEntity>(
      `SELECT * FROM invoices WHERE (id = $1 OR invoice_number = $1) AND deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async getInvoiceWithItems(id: string): Promise<{ invoice: InvoiceEntity; items: InvoiceItemEntity[] } | null> {
    const client = await this.getClient();
    const inv = await this.getInvoiceById(id);
    if (!inv) return null;

    const itemsRes = await client.query<InvoiceItemEntity>(
      `SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at ASC`,
      [inv.id]
    );
    return { invoice: inv, items: itemsRes.rows };
  }

  async createInvoice(data: Partial<InvoiceEntity>): Promise<InvoiceEntity> {
    const client = await this.getClient();
    const res = await client.query<InvoiceEntity>(
      `INSERT INTO invoices (
         id, invoice_number, booking_id, customer_id, customer_name,
         customer_email, customer_phone, billing_address, subtotal,
         discount_amount, tax_amount, grand_total, amount_paid,
         balance_amount, currency, status, issued_at, due_date,
         created_at, updated_at
       )
       VALUES (
         $1, $2, $3, $4, $5,
         $6, $7, $8, $9,
         $10, $11, $12, $13,
         $14, $15, $16, CURRENT_TIMESTAMP, $17,
         CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
       )
       RETURNING *`,
      [
        data.id,
        data.invoice_number,
        data.booking_id || null,
        data.customer_id,
        data.customer_name,
        data.customer_email || null,
        data.customer_phone || null,
        data.billing_address || null,
        data.subtotal || 0,
        data.discount_amount || 0,
        data.tax_amount || 0,
        data.grand_total || 0,
        data.amount_paid || 0,
        data.balance_amount || 0,
        data.currency || 'INR',
        data.status || 'ISSUED',
        data.due_date || null,
      ]
    );
    return res.rows[0];
  }

  async listLedgerEntries(options: {
    account?: string;
    entryType?: string;
    referenceType?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ entries: LedgerEntryEntity[]; total: number; summary: { totalDebit: number; totalCredit: number } }> {
    const client = await this.getClient();
    let whereClause = `WHERE 1=1`;
    const params: any[] = [];

    if (options.account && options.account !== 'ALL') {
      params.push(options.account);
      whereClause += ` AND account = $${params.length}`;
    }
    if (options.entryType && options.entryType !== 'ALL') {
      params.push(options.entryType);
      whereClause += ` AND entry_type = $${params.length}`;
    }
    if (options.referenceType && options.referenceType !== 'ALL') {
      params.push(options.referenceType);
      whereClause += ` AND reference_type = $${params.length}`;
    }

    const countRes = await client.query<{ count: string; total_debit: string; total_credit: string }>(
      `SELECT COUNT(*) as count,
              COALESCE(SUM(debit), 0) as total_debit,
              COALESCE(SUM(credit), 0) as total_credit
       FROM ledger_entries ${whereClause}`,
      params
    );

    const total = parseInt(countRes.rows[0]?.count || '0', 10);
    const totalDebit = parseFloat(countRes.rows[0]?.total_debit || '0');
    const totalCredit = parseFloat(countRes.rows[0]?.total_credit || '0');

    let sql = `SELECT * FROM ledger_entries ${whereClause} ORDER BY posted_at DESC`;
    if (options.limit) {
      params.push(options.limit);
      sql += ` LIMIT $${params.length}`;
    }
    if (options.offset) {
      params.push(options.offset);
      sql += ` OFFSET $${params.length}`;
    }

    const res = await client.query<LedgerEntryEntity>(sql, params);
    return {
      entries: res.rows,
      total,
      summary: { totalDebit, totalCredit },
    };
  }

  async getFinancialSummary(): Promise<{
    totalCollected: number;
    totalVerified: number;
    totalRefunded: number;
    totalReceivable: number;
    totalRevenue: number;
    totalTechnicianCommissions: number;
  }> {
    const client = await this.getClient();

    const [payRes, invRes, earnRes] = await Promise.all([
      client.query(`
        SELECT
          COALESCE(SUM(CASE WHEN status IN ('COLLECTED', 'VERIFIED') THEN amount ELSE 0 END), 0) as total_collected,
          COALESCE(SUM(CASE WHEN status = 'VERIFIED' THEN amount ELSE 0 END), 0) as total_verified,
          COALESCE(SUM(CASE WHEN status = 'REFUNDED' THEN refund_amount ELSE 0 END), 0) as total_refunded
        FROM payments
      `),
      client.query(`
        SELECT
          COALESCE(SUM(balance_amount), 0) as total_receivable,
          COALESCE(SUM(grand_total), 0) as total_revenue
        FROM invoices
        WHERE deleted_at IS NULL
      `),
      client.query(`
        SELECT COALESCE(SUM(amount), 0) as total_commissions
        FROM technician_earnings
      `),
    ]);

    return {
      totalCollected: parseFloat(payRes.rows[0]?.total_collected || '0'),
      totalVerified: parseFloat(payRes.rows[0]?.total_verified || '0'),
      totalRefunded: parseFloat(payRes.rows[0]?.total_refunded || '0'),
      totalReceivable: parseFloat(invRes.rows[0]?.total_receivable || '0'),
      totalRevenue: parseFloat(invRes.rows[0]?.total_revenue || '0'),
      totalTechnicianCommissions: parseFloat(earnRes.rows[0]?.total_commissions || '0'),
    };
  }
}

export const financeRepository = new FinanceRepository();
