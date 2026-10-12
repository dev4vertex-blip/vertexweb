import { Router } from 'express';
import { memoryStore } from '../../db/memoryStore.js';
import { financeRepository } from '../repositories/financeRepository.js';
import { financeService } from '../services/financeService.js';
import {
  authenticateUser,
  AuthenticatedRequest,
  requirePlatform,
  requirePermission,
  requireAnyPermission,
} from '../middleware.js';
import { logAuditEvent } from '../auth.js';

const router = Router();

// All payment management endpoints require authentication and Business Hub platform guard
router.use(authenticateUser);
router.use(requirePlatform('BUSINESS'));

/**
 * GET /api/v1/payments/summary
 * Financial overview for finance managers (total collected, verified, refunds, receivables, revenue)
 */
router.get('/summary', requirePermission('PAYMENT_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const summary = await financeService.getSummary();
    return res.json({
      success: true,
      data: summary,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve financial summary';
    return res.status(500).json({ success: false, error: { code: 'FINANCIAL_SUMMARY_FAILED', message: msg } });
  }
});

/**
 * GET /api/v1/payments/ledger
 * Complete double-entry general ledger entries for accounting and audit compliance
 */
router.get('/ledger', requireAnyPermission(['PAYMENT_VIEW', 'INVOICE_VIEW']), async (req: AuthenticatedRequest, res) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '50', 10)));
    const account = (req.query.account as string || '').trim().toUpperCase();
    const entryType = (req.query.entry_type as string || '').trim().toUpperCase();
    const referenceType = (req.query.reference_type as string || '').trim().toUpperCase();
    const offset = (page - 1) * limit;

    const { entries, total, summary } = await financeService.listLedger({
      account: account || undefined,
      entryType: entryType || undefined,
      referenceType: referenceType || undefined,
      limit,
      offset,
    });

    return res.json({
      success: true,
      data: entries,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        totalDebit: summary.totalDebit,
        totalCredit: summary.totalCredit,
        isBalanced: Math.abs(summary.totalDebit - summary.totalCredit) < 0.05,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve ledger entries';
    return res.status(500).json({ success: false, error: { code: 'LEDGER_FETCH_FAILED', message: msg } });
  }
});

/**
 * GET /api/v1/payments/invoices
 * Retrieve authoritative invoices list
 */
router.get('/invoices', requirePermission('INVOICE_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const status = (req.query.status as string || '').trim().toUpperCase();
    const search = (req.query.search as string || '').trim();
    const customerId = (req.query.customer_id as string || '').trim();
    const bookingId = (req.query.booking_id as string || '').trim();
    const offset = (page - 1) * limit;

    const { invoices, total } = await financeService.listInvoices({
      customerId: customerId || undefined,
      bookingId: bookingId || undefined,
      status: status || undefined,
      search: search || undefined,
      limit,
      offset,
    });

    return res.json({
      success: true,
      data: invoices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve invoices';
    return res.status(500).json({ success: false, error: { code: 'INVOICE_FETCH_FAILED', message: msg } });
  }
});

/**
 * GET /api/v1/payments/invoices/:id
 * Retrieve specific invoice and itemized line breakdown
 */
router.get('/invoices/:id', requirePermission('INVOICE_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const invoiceData = await financeService.getInvoice(id);

    return res.json({
      success: true,
      data: invoiceData.invoice,
      items: invoiceData.items,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve invoice details';
    return res.status(404).json({ success: false, error: { code: 'INVOICE_NOT_FOUND', message: msg } });
  }
});

/**
 * GET /api/v1/payments
 * Retrieve payments with filtering, pagination and status checks
 * Required permission: PAYMENT_VIEW
 */
router.get('/', requirePermission('PAYMENT_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const statusFilter = (req.query.status as string || '').trim().toUpperCase();
    const methodFilter = (req.query.method as string || '').trim().toUpperCase();
    const search = (req.query.search as string || '').trim().toLowerCase();
    const offset = (page - 1) * limit;

    const { payments, total } = await financeRepository.listPayments({
      status: statusFilter,
      method: methodFilter,
      search,
      limit,
      offset,
    });

    return res.json({
      success: true,
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve payments';
    return res.status(500).json({ success: false, error: { code: 'PAYMENT_FETCH_FAILED', message: msg } });
  }
});

/**
 * GET /api/v1/payments/:id
 * Retrieve details of a specific payment record
 * Required permission: PAYMENT_VIEW
 */
router.get('/:id', requirePermission('PAYMENT_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const payment = await financeRepository.getPaymentById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: { code: 'PAYMENT_NOT_FOUND', message: `Payment with ID ${id} not found.` },
      });
    }

    return res.json({
      success: true,
      data: payment,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve payment details';
    return res.status(500).json({ success: false, error: { code: 'PAYMENT_DETAIL_FAILED', message: msg } });
  }
});

/**
 * POST /api/v1/payments/collect
 * Collect payment on-site, in-branch, or digitally with strict transactional integrity
 * Supported roles: Sales Team, Technicians, Managers, Finance, Super Admin
 * Required permission: PAYMENT_COLLECT (or PAYMENT_CREATE)
 */
router.post('/collect', requireAnyPermission(['PAYMENT_COLLECT', 'PAYMENT_CREATE']), async (req: AuthenticatedRequest, res) => {
  try {
    const currentUser = req.user;
    const {
      booking_id,
      invoice_id,
      customer_id,
      customer_name,
      customer_phone,
      amount,
      payment_method,
      payment_reference,
      notes,
      idempotency_key,
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Valid payment amount greater than zero is required.' },
      });
    }

    if (!payment_method || !['CASH', 'UPI', 'CARD', 'NET_BANKING', 'WALLET'].includes(payment_method.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Payment method must be one of: CASH, UPI, CARD, NET_BANKING, WALLET.' },
      });
    }

    const key = idempotency_key || (req.headers['x-idempotency-key'] as string);

    // Collect payment with transactional locks, overpayment verification, invoice updates, and balanced double-entry ledger
    const { payment, invoice, isDuplicate } = await financeService.collectPayment({
      bookingId: booking_id,
      invoiceId: invoice_id,
      customerId: customer_id,
      customerName: customer_name,
      customerPhone: customer_phone,
      amount: Number(amount),
      paymentMethod: payment_method.toUpperCase(),
      paymentReference: payment_reference,
      collectedBy: currentUser.id,
      collectedByName: currentUser.name,
      notes: notes ? notes.trim() : 'Payment collected on-site.',
      idempotencyKey: key || undefined,
    });

    if (isDuplicate) {
      return res.status(200).json({
        success: true,
        message: 'Payment already recorded (idempotent replay).',
        data: payment,
        isDuplicate: true,
      });
    }

    // In-memory sync for backward compatibility with non-migrated UI
    memoryStore.payments.unshift({
      id: payment.id,
      public_id: payment.public_id,
      booking_id: payment.booking_id || 'VTX-DIRECT',
      customer_id: payment.customer_id || 'cust-1',
      customer_name: payment.customer_name,
      customer_phone: payment.customer_phone || '+91 98000 00000',
      amount: Number(payment.amount),
      currency: payment.currency,
      payment_method: payment.payment_method as any,
      payment_reference: payment.payment_reference || '',
      status: payment.status as any,
      collected_by: payment.collected_by,
      collected_by_name: payment.collected_by_name,
      collected_at: payment.collected_at,
      notes: payment.notes || '',
      receipt_number: payment.receipt_number || '',
      verified_by: payment.verified_by,
      verified_at: payment.verified_at,
      refund_reason: null,
      refund_status: 'NONE',
      refund_amount: null,
      refund_approved_by: null,
      idempotency_key: payment.idempotency_key,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
    });

    // Audit Log
    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'PAYMENT_COLLECTED',
      entity: 'PAYMENT',
      entityId: payment.id,
      newValue: {
        public_id: payment.public_id,
        amount: payment.amount,
        method: payment.payment_method,
        booking_id: payment.booking_id,
        invoice_id: invoice?.id,
        receipt_number: payment.receipt_number,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      success: true,
      message: `Payment of ₹${payment.amount} recorded successfully. Receipt #${payment.receipt_number}.`,
      data: payment,
      invoice,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to collect payment';
    return res.status(500).json({ success: false, error: { code: 'PAYMENT_COLLECT_FAILED', message: msg } });
  }
});

/**
 * POST /api/v1/payments/:id/verify
 * Finance team verifies and reconciles cash or offline payments
 * Required permission: PAYMENT_VERIFY (or PAYMENT_RECONCILE)
 */
router.post('/:id/verify', requireAnyPermission(['PAYMENT_VERIFY', 'PAYMENT_RECONCILE']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const payment = await financeRepository.getPaymentById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: { code: 'PAYMENT_NOT_FOUND', message: `Payment ${id} not found.` },
      });
    }

    if (payment.status === 'VERIFIED') {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_VERIFIED', message: 'Payment has already been verified.' },
      });
    }

    const verified = await financeService.verifyPayment(payment.id, currentUser.id);

    // In-memory sync
    const memPayment = memoryStore.payments.find((p) => p.id === payment.id || p.public_id === payment.public_id);
    if (memPayment) {
      memPayment.status = 'VERIFIED';
      memPayment.verified_by = currentUser.id;
      memPayment.verified_at = new Date().toISOString();
    }

    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'PAYMENT_VERIFIED',
      entity: 'PAYMENT',
      entityId: payment.id,
      oldValue: { status: payment.status },
      newValue: { status: 'VERIFIED', verified_by: currentUser.id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: `Payment ${payment.public_id} successfully verified and reconciled.`,
      data: verified,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to verify payment';
    return res.status(500).json({ success: false, error: { code: 'PAYMENT_VERIFY_FAILED', message: msg } });
  }
});

/**
 * POST /api/v1/payments/:id/refund-request
 * Submit a refund request with customer justification
 * Required permission: PAYMENT_REFUND_REQUEST (or PAYMENT_REFUND)
 */
router.post('/:id/refund-request', requireAnyPermission(['PAYMENT_REFUND_REQUEST', 'PAYMENT_REFUND']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const { reason, refund_amount } = req.body;

    const payment = await financeRepository.getPaymentById(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: { code: 'PAYMENT_NOT_FOUND', message: `Payment ${id} not found.` },
      });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Refund reason/justification is required.' },
      });
    }

    const requestedAmount = refund_amount ? Number(refund_amount) : Number(payment.amount);
    if (requestedAmount <= 0 || requestedAmount > Number(payment.amount)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REFUND_AMOUNT', message: `Refund amount must be between ₹1 and ₹${payment.amount}.` },
      });
    }

    const updated = await financeService.requestRefund(payment.id, requestedAmount, reason.trim());

    // In-memory sync
    const memPayment = memoryStore.payments.find((p) => p.id === payment.id || p.public_id === payment.public_id);
    if (memPayment) {
      memPayment.refund_status = 'REQUESTED';
      memPayment.refund_reason = reason.trim();
      memPayment.refund_amount = requestedAmount;
    }

    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'PAYMENT_REFUND_REQUESTED',
      entity: 'PAYMENT',
      entityId: payment.id,
      newValue: {
        refund_amount: requestedAmount,
        reason: reason.trim(),
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: `Refund of ₹${requestedAmount} requested for payment ${payment.public_id}. Awaiting Finance Manager approval.`,
      data: updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to request refund';
    return res.status(500).json({ success: false, error: { code: 'REFUND_REQUEST_FAILED', message: msg } });
  }
});

/**
 * POST /api/v1/payments/:id/refund-approve
 * Finance Approver authorizes the refund (transactional balance adjustments & ledger posting)
 * Required permission: PAYMENT_REFUND_APPROVE (or PAYMENT_REFUND)
 */
router.post('/:id/refund-approve', requireAnyPermission(['PAYMENT_REFUND_APPROVE', 'PAYMENT_REFUND']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const payment = await financeRepository.getPaymentById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: { code: 'PAYMENT_NOT_FOUND', message: `Payment ${id} not found.` },
      });
    }

    if (payment.refund_status === 'APPROVED' || payment.status === 'REFUNDED') {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_APPROVED', message: 'Refund has already been approved or processed.' },
      });
    }

    const updated = await financeService.approveRefund(payment.id, currentUser.id);

    // In-memory sync
    const memPayment = memoryStore.payments.find((p) => p.id === payment.id || p.public_id === payment.public_id);
    if (memPayment) {
      (memPayment as any).refund_status = 'PROCESSED';
      memPayment.status = 'REFUNDED';
      memPayment.refund_approved_by = currentUser.id;
    }

    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'PAYMENT_REFUND_APPROVED',
      entity: 'PAYMENT',
      entityId: payment.id,
      newValue: {
        refund_amount: updated.refund_amount,
        approved_by: currentUser.id,
        status: 'REFUNDED',
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: `Refund for payment ${payment.public_id} of ₹${updated.refund_amount} approved and processed.`,
      data: updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to approve refund';
    return res.status(500).json({ success: false, error: { code: 'REFUND_APPROVE_FAILED', message: msg } });
  }
});

export default router;
