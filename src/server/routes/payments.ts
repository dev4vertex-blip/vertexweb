import { Router } from 'express';
import crypto from 'crypto';
import { getDb } from '../../db/client.js';
import { memoryStore, PaymentRecord } from '../../db/memoryStore.js';
import { authenticateUser, AuthenticatedRequest, requirePermission, requireAnyPermission } from '../middleware.js';
import { logAuditEvent } from '../auth.js';

const router = Router();

// All payment management endpoints require authentication
router.use(authenticateUser);

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

    let payments = [...memoryStore.payments];

    if (statusFilter && statusFilter !== 'ALL') {
      payments = payments.filter((p) => p.status.toUpperCase() === statusFilter);
    }

    if (methodFilter && methodFilter !== 'ALL') {
      payments = payments.filter((p) => p.payment_method.toUpperCase() === methodFilter);
    }

    if (search) {
      payments = payments.filter(
        (p) =>
          p.public_id.toLowerCase().includes(search) ||
          p.booking_id.toLowerCase().includes(search) ||
          (p.customer_name && p.customer_name.toLowerCase().includes(search)) ||
          (p.payment_reference && p.payment_reference.toLowerCase().includes(search)) ||
          (p.receipt_number && p.receipt_number.toLowerCase().includes(search))
      );
    }

    const total = payments.length;
    const startIndex = (page - 1) * limit;
    const paginated = payments.slice(startIndex, startIndex + limit);

    return res.json({
      success: true,
      data: paginated,
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
    const payment = memoryStore.payments.find((p) => p.id === id || p.public_id === id);

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
 * Collect payment on-site, in-branch, or digitally
 * Supported roles: Sales Team, Technicians, Managers, Finance, Super Admin
 * Required permission: PAYMENT_COLLECT (or PAYMENT_CREATE)
 */
router.post('/collect', requireAnyPermission(['PAYMENT_COLLECT', 'PAYMENT_CREATE']), async (req: AuthenticatedRequest, res) => {
  try {
    const currentUser = req.user;
    const {
      booking_id,
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

    // Check idempotency if key provided
    const key = idempotency_key || req.headers['x-idempotency-key'] as string;
    if (key) {
      const existing = memoryStore.payments.find((p) => p.idempotency_key === key);
      if (existing) {
        return res.status(200).json({
          success: true,
          message: 'Payment already recorded (idempotent replay).',
          data: existing,
          isDuplicate: true,
        });
      }
    }

    // Resolve booking details if provided
    let resolvedCustomerName = customer_name || 'Customer';
    let resolvedCustomerPhone = customer_phone || '+91 98000 00000';
    let resolvedCustomerId = customer_id || 'cust-1';

    if (booking_id) {
      const booking = memoryStore.bookings.find((b) => b.id === booking_id || b.public_id === booking_id);
      if (booking) {
        resolvedCustomerName = booking.customer_name || resolvedCustomerName;
        resolvedCustomerPhone = booking.customer_phone || resolvedCustomerPhone;
        resolvedCustomerId = booking.customer_id || resolvedCustomerId;

        // Mark booking payment status as PAID if collected
        booking.payment_status = 'PAID';
        booking.updated_at = new Date().toISOString();
      }
    }

    const nextIdNum = memoryStore.payments.length + 1;
    const publicId = `VXPY-${String(nextIdNum).padStart(6, '0')}`;
    const newPaymentId = `pay-${crypto.randomUUID()}`;
    const receiptNum = `RCP-${new Date().getFullYear()}-${String(nextIdNum + 100).padStart(5, '0')}`;

    const newPayment: PaymentRecord = {
      id: newPaymentId,
      public_id: publicId,
      booking_id: booking_id || 'VTX-DIRECT',
      customer_id: resolvedCustomerId,
      customer_name: resolvedCustomerName,
      customer_phone: resolvedCustomerPhone,
      amount: Number(amount),
      currency: 'INR',
      payment_method: payment_method.toUpperCase(),
      payment_reference: payment_reference || `REF-${Date.now().toString().slice(-8)}`,
      status: payment_method.toUpperCase() === 'CASH' ? 'COLLECTED' : 'VERIFIED',
      collected_by: currentUser.id,
      collected_by_name: currentUser.name,
      collected_at: new Date().toISOString(),
      notes: notes ? notes.trim() : 'Payment collected on-site.',
      receipt_number: receiptNum,
      verified_by: payment_method.toUpperCase() === 'CASH' ? null : currentUser.id,
      verified_at: payment_method.toUpperCase() === 'CASH' ? null : new Date().toISOString(),
      refund_reason: null,
      refund_status: 'NONE',
      refund_amount: null,
      refund_approved_by: null,
      idempotency_key: key || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    memoryStore.payments.unshift(newPayment);

    // Audit Log
    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'PAYMENT_COLLECTED',
      entity: 'PAYMENT',
      entityId: newPayment.id,
      newValue: {
        public_id: publicId,
        amount: newPayment.amount,
        method: newPayment.payment_method,
        booking_id: newPayment.booking_id,
        receipt_number: newPayment.receipt_number,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      success: true,
      message: `Payment of ₹${newPayment.amount} recorded successfully. Receipt #${newPayment.receipt_number}.`,
      data: newPayment,
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
    const payment = memoryStore.payments.find((p) => p.id === id || p.public_id === id);

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

    const previousStatus = payment.status;
    payment.status = 'VERIFIED';
    payment.verified_by = currentUser.id;
    payment.verified_at = new Date().toISOString();
    payment.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'PAYMENT_VERIFIED',
      entity: 'PAYMENT',
      entityId: payment.id,
      oldValue: { status: previousStatus },
      newValue: { status: payment.status, verified_by: currentUser.id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: `Payment ${payment.public_id} successfully verified and reconciled.`,
      data: payment,
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

    const payment = memoryStore.payments.find((p) => p.id === id || p.public_id === id);
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

    const requestedAmount = refund_amount ? Number(refund_amount) : payment.amount;
    if (requestedAmount <= 0 || requestedAmount > payment.amount) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REFUND_AMOUNT', message: `Refund amount must be between ₹1 and ₹${payment.amount}.` },
      });
    }

    payment.refund_status = 'REQUESTED';
    payment.refund_reason = reason.trim();
    payment.refund_amount = requestedAmount;
    payment.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'PAYMENT_REFUND_REQUESTED',
      entity: 'PAYMENT',
      entityId: payment.id,
      newValue: {
        refund_amount: requestedAmount,
        reason: payment.refund_reason,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: `Refund of ₹${requestedAmount} requested for payment ${payment.public_id}. Awaiting Finance Manager approval.`,
      data: payment,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to request refund';
    return res.status(500).json({ success: false, error: { code: 'REFUND_REQUEST_FAILED', message: msg } });
  }
});

/**
 * POST /api/v1/payments/:id/refund-approve
 * Finance Approver authorizes the refund
 * Required permission: PAYMENT_REFUND_APPROVE (or PAYMENT_REFUND)
 */
router.post('/:id/refund-approve', requireAnyPermission(['PAYMENT_REFUND_APPROVE', 'PAYMENT_REFUND']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const payment = memoryStore.payments.find((p) => p.id === id || p.public_id === id);

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

    payment.refund_status = 'APPROVED';
    payment.status = 'REFUNDED';
    payment.refund_approved_by = currentUser.id;
    payment.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'PAYMENT_REFUND_APPROVED',
      entity: 'PAYMENT',
      entityId: payment.id,
      newValue: {
        refund_amount: payment.refund_amount,
        approved_by: currentUser.id,
        status: payment.status,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: `Refund for payment ${payment.public_id} of ₹${payment.refund_amount} approved and processed.`,
      data: payment,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to approve refund';
    return res.status(500).json({ success: false, error: { code: 'REFUND_APPROVE_FAILED', message: msg } });
  }
});

export default router;
