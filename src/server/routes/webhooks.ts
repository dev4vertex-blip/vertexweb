import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { getDb } from '../../db/client.js';
import { logAuditEvent } from '../auth.js';
import { webhookRateLimiter } from '../rateLimiter.js';

const router = Router();

// Store processed webhook event IDs in memory to ensure idempotency and prevent replay attacks
const processedWebhookEventIds = new Set<string>();

const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'vertex_payment_webhook_secret_key_2026';

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
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(timestampHeader ? `${timestampHeader}.${payload}` : payload)
      .digest('hex');

    // Also support direct test secret matching in development
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const isDirectMatch = isDevelopment && (signature === WEBHOOK_SECRET || signature === 'test_sig_dev');

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

    // 3. Idempotency and duplicate event protection
    const eventId = req.body?.eventId || req.body?.id;
    if (eventId) {
      if (processedWebhookEventIds.has(eventId)) {
        return res.json({
          success: true,
          status: 'already_processed',
          message: 'Webhook event already processed previously',
        });
      }
      processedWebhookEventIds.add(eventId);
    }

    // 4. Process event
    const eventType = req.body?.event || req.body?.type;
    const bookingId = req.body?.data?.bookingId || req.body?.bookingId;

    if (eventType === 'payment.captured' || eventType === 'payment.success') {
      if (bookingId) {
        const { pglite } = await getDb();
        await pglite.query(
          `UPDATE bookings SET payment_status = 'PAID', updated_at = CURRENT_TIMESTAMP WHERE (id = $1 OR public_id = $1)`,
          [bookingId]
        );

        await logAuditEvent({
          userName: 'PAYMENT_GATEWAY',
          userRole: 'SYSTEM_WEBHOOK',
          action: 'PAYMENT_CAPTURED_WEBHOOK',
          entity: 'BOOKINGS',
          entityId: bookingId,
          newValue: { eventId, eventType, amount: req.body?.data?.amount },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
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
