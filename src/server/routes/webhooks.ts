import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { getDb } from '../../db/client.js';
import { financeRepository } from '../repositories/financeRepository.js';
import { logAuditEvent } from '../auth.js';
import { webhookRateLimiter } from '../rateLimiter.js';

const router = Router();

// Store processed webhook event IDs in memory to ensure idempotency and prevent replay attacks
const processedWebhookEventIds = new Set<string>();

function getWebhookSecret(): string {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET?.trim() || process.env.WEBHOOK_SECRET?.trim();
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.length < 16 || secret === 'vertex_payment_webhook_secret_key_2026') {
      throw new Error('[CRITICAL] Missing or insecure PAYMENT_WEBHOOK_SECRET in production.');
    }
    return secret;
  }
  return secret || 'vertex_payment_webhook_secret_key_2026';
}

/**
 * POST /api/v1/webhooks/payment and /api/v1/webhooks/razorpay
 * Handles payment gateway webhooks (e.g., Razorpay, Stripe) with signature and timestamp validation
 */
const handleWebhook = async (req: Request, res: Response) => {
  try {
    const signature = (req.headers['x-webhook-signature'] || req.headers['x-razorpay-signature']) as string;
    const timestampHeader = req.headers['x-webhook-timestamp'] as string;

    // 1. Signature Verification
    if (!signature) {
      return res.status(401).json({
        success: false,
        error: { code: 'MISSING_SIGNATURE', message: 'Missing webhook signature header' },
      });
    }

    // 2. Timestamp freshness validation (prevent replay attacks, max 5 minutes old)
    if (timestampHeader) {
      const timestamp = parseInt(timestampHeader, 10);
      const currentTime = Math.floor(Date.now() / 1000);
      if (isNaN(timestamp) || Math.abs(currentTime - timestamp) > 300) {
        return res.status(400).json({
          success: false,
          error: { code: 'TIMESTAMP_EXPIRED', message: 'Webhook timestamp has expired or is invalid' },
        });
      }
    }

    // Verify HMAC sha256 signature
    const webhookSecret = getWebhookSecret();
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(timestampHeader ? `${timestampHeader}.${payload}` : payload)
      .digest('hex');

    // Only allow direct test secret matching in development
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const isDirectMatch = isDevelopment && (signature === webhookSecret || signature === 'test_sig_dev');

    if (!isDirectMatch && signature !== expectedSignature) {
      await logAuditEvent({
        userName: 'PAYMENT_GATEWAY_WEBHOOK',
        userRole: 'INTEGRATION',
        action: 'WEBHOOK_SIGNATURE_FAILED',
        entity: 'PAYMENT',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_SIGNATURE', message: 'Webhook signature verification failed' },
      });
    }

    // 3. Persistent Database Idempotency Protection (payment_webhook_events table)
    const eventId = req.body?.eventId || req.body?.id || req.body?.payload?.payment?.entity?.id;
    const provider = req.path.includes('razorpay') ? 'RAZORPAY' : 'GENERIC_PAYMENT_GATEWAY';
    const { pglite } = await getDb();

    if (eventId) {
      try {
        // Query persistent database storage for duplicate events
        const existingEvent = await pglite.query(
          `SELECT id, status, received_at FROM payment_webhook_events WHERE provider = $1 AND event_id = $2 LIMIT 1`,
          [provider, eventId]
        );

        if (existingEvent.rows.length > 0) {
          return res.json({
            success: true,
            status: 'already_processed',
            message: 'Webhook event already processed previously (persisted in payment_webhook_events)',
          });
        }

        // Store event idempotently
        await pglite.query(
          `INSERT INTO payment_webhook_events (id, provider, event_id, event_type, payload, status, received_at, processed_at)
           VALUES ($1, $2, $3, $4, $5, 'PROCESSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            `evt-${crypto.randomUUID()}`,
            provider,
            eventId,
            req.body?.event || req.body?.type || 'payment.event',
            JSON.stringify(req.body),
          ]
        );
      } catch (dbErr) {
        // Fallback to in-memory set if database record insert encounters a race condition or table pending
        if (processedWebhookEventIds.has(eventId)) {
          return res.json({
            success: true,
            status: 'already_processed',
            message: 'Webhook event already processed previously',
          });
        }
        processedWebhookEventIds.add(eventId);
      }
    }

    // 4. Process event
    const eventType = req.body?.event || req.body?.type;
    const bookingId =
      req.body?.data?.bookingId ||
      req.body?.bookingId ||
      req.body?.payload?.payment?.entity?.notes?.bookingId;

    if (eventType === 'payment.captured' || eventType === 'payment.success') {
      if (bookingId) {
        // Look up authoritative booking details from PostgreSQL
        const bRes = await pglite.query(
          `SELECT b.*, u.name as customer_name, u.phone as customer_phone
           FROM bookings b
           LEFT JOIN users u ON u.id = b.customer_id
           WHERE (b.id = $1 OR b.public_id = $1) LIMIT 1`,
          [bookingId]
        );

        if (bRes.rows.length > 0) {
          const booking = bRes.rows[0];
          // Determine capture amount: Razorpay provides amount in paise
          const rawAmount = req.body?.data?.amount || req.body?.payload?.payment?.entity?.amount;
          let authoritativeAmount = Number(booking.total_amount);
          if (rawAmount) {
            const parsed = Number(rawAmount);
            authoritativeAmount = parsed > 1000 && provider === 'RAZORPAY' ? parsed / 100 : parsed;
          }

          // Transaction-safe payment collection:
          // Updates invoice (amount_paid, balance_amount, status='PAID'), booking (payment_status='PAID'),
          // records payment entity with provider transaction reference, and writes balanced double-entry ledger records
          await financeRepository.collectPaymentWithTransaction({
            bookingId: booking.id,
            customerId: booking.customer_id,
            customerName: booking.customer_name || 'Customer',
            customerPhone: booking.customer_phone || undefined,
            amount: authoritativeAmount,
            paymentMethod: 'ONLINE',
            paymentReference: eventId || 'GATEWAY_SUCCESS',
            collectedBy: booking.customer_id,
            collectedByName: `${provider} Gateway Webhook`,
            notes: `Auto-reconciled from ${provider} webhook event ${eventId}`,
            idempotencyKey: `webhook-${provider}-${eventId}`,
          });

          await logAuditEvent({
            userName: `${provider}_GATEWAY`,
            userRole: 'SYSTEM_WEBHOOK',
            action: 'PAYMENT_CAPTURED_WEBHOOK',
            entity: 'BOOKINGS',
            entityId: booking.id,
            newValue: {
              eventId,
              eventType,
              amount: authoritativeAmount,
              provider,
            },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          });
        }
      }
    }

    return res.json({
      success: true,
      received: true,
      status: 'acknowledged',
      eventId,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Webhook handling failed';
    return res.status(500).json({ success: false, error: msg });
  }
};

router.post('/payment', webhookRateLimiter, handleWebhook);
router.post('/razorpay', webhookRateLimiter, handleWebhook);

export default router;
