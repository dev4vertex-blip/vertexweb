import crypto from 'crypto';
import { BaseRepository, DatabaseTransactionContext } from './baseRepository.js';

export interface BookingEntity {
  id: string;
  public_id: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  service_id: string | null;
  service_name: string | null;
  service_category: string | null;
  technician_id: string | null;
  technician_name: string | null;
  technician_phone: string | null;
  scheduled_date: string;
  time_slot: string;
  service_address: string;
  service_address_snapshot: any;
  service_price_snapshot: number | string | null;
  total_amount: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  technician_cut: number | string;
  status: string;
  payment_status: string;
  otp: string | null;
  notes: string | null;
  instructions: string | null;
  work_performed: string | null;
  parts_used: string | null;
  technician_notes: string | null;
  customer_remarks: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface BookingItemEntity {
  id: string;
  booking_id: string;
  service_id: string | null;
  service_name: string;
  unit_price: number | string;
  quantity: number;
  total_price: number | string;
  created_at: string;
}

export interface BookingStatusHistoryEntity {
  id: string;
  booking_id: string;
  previous_status: string | null;
  new_status: string;
  changed_by: string | null;
  reason: string | null;
  metadata: any;
  created_at: string;
}

export class BookingRepository extends BaseRepository {
  async getBookingById(id: string, tx?: DatabaseTransactionContext): Promise<BookingEntity | null> {
    const queryFn = tx ? tx.query : (await this.getClient()).query;
    const res = await queryFn<BookingEntity>(
      `SELECT b.*,
              c.name as customer_name, c.phone as customer_phone,
              t.name as technician_name, t.phone as technician_phone
       FROM bookings b
       LEFT JOIN users c ON c.id = b.customer_id
       LEFT JOIN users t ON t.id = b.technician_id
       WHERE (b.id = $1 OR b.public_id = $1) AND b.deleted_at IS NULL
       LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async listCustomerBookings(customerId: string): Promise<BookingEntity[]> {
    const client = await this.getClient();
    const res = await client.query<BookingEntity>(
      `SELECT b.*,
              s.name as service_name, s.category_id,
              t.name as technician_name, t.phone as technician_phone
       FROM bookings b
       LEFT JOIN services s ON s.id = b.service_id
       LEFT JOIN users t ON t.id = b.technician_id
       WHERE b.customer_id = $1 AND b.deleted_at IS NULL
       ORDER BY b.created_at DESC`,
      [customerId]
    );
    return res.rows;
  }

  async listTechnicianJobs(technicianId: string): Promise<BookingEntity[]> {
    const client = await this.getClient();
    const res = await client.query<BookingEntity>(
      `SELECT b.id, b.public_id, b.service_id, b.scheduled_date, b.time_slot,
              b.status, b.service_address, b.total_amount,
              s.name as service_name, c.name as customer_name, c.phone as customer_phone
       FROM bookings b
       LEFT JOIN services s ON s.id = b.service_id
       LEFT JOIN users c ON c.id = b.customer_id
       WHERE b.technician_id = $1 AND b.deleted_at IS NULL
       ORDER BY b.scheduled_date ASC, b.created_at DESC`,
      [technicianId]
    );
    return res.rows;
  }

  async createBookingWithTransaction(
    bookingData: Partial<BookingEntity>,
    itemData: Partial<BookingItemEntity>,
    historyData: Partial<BookingStatusHistoryEntity>
  ): Promise<BookingEntity> {
    return await this.withTransaction(async (tx) => {
      // 1. Insert Booking Header
      const bRes = await tx.query<BookingEntity>(
        `INSERT INTO bookings (
           id, public_id, customer_id, service_id, service_name, service_category,
           scheduled_date, time_slot, service_address, service_address_snapshot,
           service_price_snapshot, total_amount, discount_amount, tax_amount,
           technician_cut, status, payment_status, otp, notes, created_at, updated_at
         )
         VALUES (
           $1, $2, $3, $4, $5, $6,
           $7, $8, $9, $10,
           $11, $12, $13, $14,
           $15, $16, $17, $18, $19, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
         )
         RETURNING *`,
        [
          bookingData.id,
          bookingData.public_id,
          bookingData.customer_id,
          bookingData.service_id,
          bookingData.service_name,
          bookingData.service_category || 'General Service',
          bookingData.scheduled_date,
          bookingData.time_slot,
          bookingData.service_address,
          JSON.stringify(bookingData.service_address_snapshot || {}),
          bookingData.service_price_snapshot,
          bookingData.total_amount,
          bookingData.discount_amount || 0,
          bookingData.tax_amount || 0,
          bookingData.technician_cut || 0,
          bookingData.status || 'Pending',
          bookingData.payment_status || 'PENDING',
          bookingData.otp,
          bookingData.notes || '',
        ]
      );

      const createdBooking = bRes.rows[0];

      // 2. Insert Booking Item
      await tx.query(
        `INSERT INTO booking_items (id, booking_id, service_id, service_name, unit_price, quantity, total_price, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
        [
          itemData.id,
          createdBooking.id,
          itemData.service_id,
          itemData.service_name,
          itemData.unit_price,
          itemData.quantity || 1,
          itemData.total_price,
        ]
      );

      // 3. Insert Initial Booking Status History
      await tx.query(
        `INSERT INTO booking_status_history (id, booking_id, previous_status, new_status, changed_by, reason, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [
          historyData.id,
          createdBooking.id,
          null,
          historyData.new_status || 'Pending',
          historyData.changed_by || createdBooking.customer_id,
          historyData.reason || 'Initial Booking Creation',
        ]
      );

      return createdBooking;
    });
  }

  async assignTechnicianWithTransaction(
    bookingId: string,
    technicianId: string,
    technicianName: string,
    technicianPhone: string,
    assignedBy: string
  ): Promise<BookingEntity> {
    return await this.withTransaction(async (tx) => {
      const current = await this.getBookingById(bookingId, tx);
      if (!current) throw new Error('Booking not found');

      const bRes = await tx.query<BookingEntity>(
        `UPDATE bookings
         SET technician_id = $1,
             technician_name = $2,
             technician_phone = $3,
             status = 'Assigned',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [technicianId, technicianName, technicianPhone, current.id]
      );

      // Record state history
      await tx.query(
        `INSERT INTO booking_status_history (id, booking_id, previous_status, new_status, changed_by, reason, created_at)
         VALUES ($1, $2, $3, 'Assigned', $4, 'Technician Dispatch', CURRENT_TIMESTAMP)`,
        [`bsh-${crypto.randomUUID()}`, current.id, current.status, assignedBy]
      );

      return bRes.rows[0];
    });
  }

  async updateStatusWithTransaction(
    bookingId: string,
    newStatus: string,
    changedBy: string,
    reason?: string
  ): Promise<BookingEntity> {
    return await this.withTransaction(async (tx) => {
      const current = await this.getBookingById(bookingId, tx);
      if (!current) throw new Error('Booking not found');

      const bRes = await tx.query<BookingEntity>(
        `UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
        [newStatus, current.id]
      );

      await tx.query(
        `INSERT INTO booking_status_history (id, booking_id, previous_status, new_status, changed_by, reason, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [`bsh-${crypto.randomUUID()}`, current.id, current.status, newStatus, changedBy, reason || null]
      );

      return bRes.rows[0];
    });
  }

  async completeBookingWithTransaction(
    bookingId: string,
    completionData: {
      workPerformed: string;
      partsUsed: string;
      technicianNotes: string;
      customerRemarks: string;
    },
    technicianId: string,
    earningAmount: number
  ): Promise<BookingEntity> {
    return await this.withTransaction(async (tx) => {
      // Row-level lock to prevent concurrent completion races
      const lockRes = await tx.query<BookingEntity>(
        `SELECT * FROM bookings WHERE (id = $1 OR public_id = $1) AND deleted_at IS NULL FOR UPDATE`,
        [bookingId]
      );
      if (lockRes.rows.length === 0) throw new Error('Booking not found');
      const current = lockRes.rows[0];

      // Idempotency: If already completed, return existing without duplicating invoice or earning
      if (current.status === 'Completed') {
        return current;
      }

      if (current.status !== 'In Progress') {
        throw new Error(`Invalid state: Job must be 'In Progress' before marking completed. Current state: '${current.status}'.`);
      }

      // 1. Update Booking to Completed
      const bRes = await tx.query<BookingEntity>(
        `UPDATE bookings
         SET status = 'Completed',
             work_performed = $1,
             parts_used = $2,
             technician_notes = $3,
             customer_remarks = $4,
             completed_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [
          completionData.workPerformed || 'Standard service procedure completed.',
          completionData.partsUsed || 'None',
          completionData.technicianNotes || 'All diagnostic tests passed.',
          completionData.customerRemarks || 'Customer signed off satisfaction.',
          current.id,
        ]
      );

      // 2. Status History
      await tx.query(
        `INSERT INTO booking_status_history (id, booking_id, previous_status, new_status, changed_by, reason, created_at)
         VALUES ($1, $2, $3, 'Completed', $4, 'Job Completed and Verified', CURRENT_TIMESTAMP)`,
        [`bsh-${crypto.randomUUID()}`, current.id, current.status, technicianId]
      );

      // 3. Generate Invoice + Invoice Items (Idempotent: check if already exists for this booking)
      const existingInvoice = await tx.query(
        `SELECT id FROM invoices WHERE booking_id = $1 AND deleted_at IS NULL LIMIT 1`,
        [current.id]
      );

      if (existingInvoice.rows.length === 0) {
        const invId = `inv-${crypto.randomUUID()}`;
        const invNum = `INV-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const total = Number(Number(current.total_amount).toFixed(2)) || 0;
        const tax = Number(Number(current.tax_amount).toFixed(2)) || 0;
        const discount = Number(Number(current.discount_amount).toFixed(2)) || 0;
        const subtotal = Math.max(0, Number((total - tax + discount).toFixed(2)));

        // Check if payments were already recorded for this booking
        const paidRes = await tx.query<{ paid_amount: string }>(
          `SELECT COALESCE(SUM(amount), 0) as paid_amount
           FROM payments
           WHERE booking_id = $1 AND status IN ('COLLECTED', 'VERIFIED') AND refund_status != 'PROCESSED'`,
          [current.id]
        );
        const recordedPaid = parseFloat(paidRes.rows[0]?.paid_amount || '0');
        const isMarkedPaid = current.payment_status === 'PAID';
        const amountPaid = Math.min(total, recordedPaid > 0 ? recordedPaid : (isMarkedPaid ? total : 0));
        const balanceAmount = Math.max(0, Number((total - amountPaid).toFixed(2)));
        const invStatus = balanceAmount === 0 ? 'PAID' : (amountPaid > 0 ? 'PARTIALLY_PAID' : 'ISSUED');

        await tx.query(
          `INSERT INTO invoices (
             id, invoice_number, booking_id, customer_id, customer_name, customer_phone,
             billing_address, subtotal, discount_amount, tax_amount, grand_total, amount_paid, balance_amount,
             status, issued_at, paid_at, created_at, updated_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CASE WHEN $14 = 'PAID' THEN CURRENT_TIMESTAMP ELSE NULL END, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            invId,
            invNum,
            current.id,
            current.customer_id,
            current.customer_name || 'Customer',
            current.customer_phone || '',
            current.service_address,
            subtotal,
            discount,
            tax,
            total,
            amountPaid,
            balanceAmount,
            invStatus,
          ]
        );

        // Insert historical invoice item preserving original service description and price
        const itemPrice = Math.max(0, subtotal);
        await tx.query(
          `INSERT INTO invoice_items (id, invoice_id, description, unit_price, quantity, tax_rate, tax_amount, total_amount, created_at)
           VALUES ($1, $2, $3, $4, 1, 18, $5, $6, CURRENT_TIMESTAMP)`,
          [
            `ivi-${crypto.randomUUID()}`,
            invId,
            current.service_name || 'Home Appliance Service',
            itemPrice,
            tax,
            total,
          ]
        );

        // Double-entry balanced ledger records for invoice issuance:
        // Debit: Accounts Receivable = grandTotal
        await tx.query(
          `INSERT INTO ledger_entries (id, entry_number, entry_type, account, debit, credit, currency, reference_type, reference_id, description, posted_by, posted_at, created_at)
           VALUES ($1, $2, 'INVOICE_ISSUED', 'ACCOUNTS_RECEIVABLE', $3, 0, 'INR', 'INVOICE', $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            `ldg-${crypto.randomUUID()}`,
            `TXN-${Date.now()}-AR`,
            total,
            invId,
            `Invoice ${invNum} issued for booking ${current.public_id}`,
            technicianId,
          ]
        );
        // Credit: Revenue = subtotal - discount
        const netRevenue = Math.max(0, Number((subtotal - discount).toFixed(2)));
        await tx.query(
          `INSERT INTO ledger_entries (id, entry_number, entry_type, account, debit, credit, currency, reference_type, reference_id, description, posted_by, posted_at, created_at)
           VALUES ($1, $2, 'INVOICE_ISSUED', 'REVENUE', 0, $3, 'INR', 'INVOICE', $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            `ldg-${crypto.randomUUID()}`,
            `TXN-${Date.now()}-REV`,
            netRevenue,
            invId,
            `Revenue recognition for invoice ${invNum}`,
            technicianId,
          ]
        );
        if (tax > 0) {
          // Credit: Tax Payable = GST tax
          await tx.query(
            `INSERT INTO ledger_entries (id, entry_number, entry_type, account, debit, credit, currency, reference_type, reference_id, description, posted_by, posted_at, created_at)
             VALUES ($1, $2, 'INVOICE_ISSUED', 'TAX_PAYABLE', 0, $3, 'INR', 'INVOICE', $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [
              `ldg-${crypto.randomUUID()}`,
              `TXN-${Date.now()}-TAX`,
              tax,
              invId,
              `GST liability for invoice ${invNum}`,
              technicianId,
            ]
          );
        }
      }

      // 4. Record Technician Earnings (Idempotent: check if already exists for this job)
      const existingEarning = await tx.query(
        `SELECT id FROM technician_earnings WHERE job_id = $1 LIMIT 1`,
        [current.id]
      );

      if (existingEarning.rows.length === 0 && earningAmount > 0) {
        const earningId = `ern-${crypto.randomUUID()}`;
        await tx.query(
          `INSERT INTO technician_earnings (id, technician_id, job_id, service, customer, date, amount, status, created_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, 'Settled', CURRENT_TIMESTAMP)`,
          [
            earningId,
            technicianId,
            current.id,
            current.service_name || 'Standard Service',
            current.customer_name || 'Customer',
            earningAmount,
          ]
        );

        // Balanced Double-Entry Ledger: Commission Expense (Debit) and Commissions Payable (Credit)
        // Debit: Commission Expense
        await tx.query(
          `INSERT INTO ledger_entries (id, entry_number, entry_type, account, debit, credit, currency, reference_type, reference_id, description, posted_by, posted_at, created_at)
           VALUES ($1, $2, 'TECHNICIAN_EARNING', 'COMMISSION_EXPENSE', $3, 0, 'INR', 'EARNING', $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            `ldg-${crypto.randomUUID()}`,
            `TXN-${Date.now()}-TECH-EXP`,
            earningAmount,
            earningId,
            `Commission expense for job ${current.public_id}`,
            technicianId,
          ]
        );
        // Credit: Technician Commissions Payable
        await tx.query(
          `INSERT INTO ledger_entries (id, entry_number, entry_type, account, debit, credit, currency, reference_type, reference_id, description, posted_by, posted_at, created_at)
           VALUES ($1, $2, 'TECHNICIAN_EARNING', 'TECHNICIAN_COMMISSIONS_PAYABLE', 0, $3, 'INR', 'EARNING', $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            `ldg-${crypto.randomUUID()}`,
            `TXN-${Date.now()}-TECHPAY`,
            earningAmount,
            earningId,
            `Technician cut payable for completed booking ${current.public_id}`,
            technicianId,
          ]
        );
      }

      return bRes.rows[0];
    });
  }
}

export const bookingRepository = new BookingRepository();
