/**
 * VERTEX Webhook & Rate Limit Security Verification
 */

import crypto from 'crypto';

const BASE_URL = 'http://localhost:3000';
const SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'vertex_payment_webhook_secret_key_2026';

async function testWebhooksAndRateLimit() {
  console.log('\n======================================================');
  console.log('   VERTEX WEBHOOK & RATE LIMITING VERIFICATION        ');
  console.log('======================================================\n');

  // 1. Webhook missing signature -> 401
  const resNoSig = await fetch(`${BASE_URL}/api/v1/webhooks/razorpay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'payment.captured', payload: {} }),
  });
  const dataNoSig = await resNoSig.json();
  console.log('Webhook without signature:', resNoSig.status, dataNoSig.error);
  if (resNoSig.status !== 401) throw new Error('Expected 401 for missing webhook signature');

  // 2. Webhook invalid signature -> 401
  const resBadSig = await fetch(`${BASE_URL}/api/v1/webhooks/razorpay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': 'invalid_signature_hex_digest',
      'X-Webhook-Timestamp': String(Math.floor(Date.now() / 1000)),
    },
    body: JSON.stringify({ event: 'payment.captured', payload: {} }),
  });
  const dataBadSig = await resBadSig.json();
  console.log('Webhook with invalid signature:', resBadSig.status, dataBadSig.error);
  if (resBadSig.status !== 401) throw new Error('Expected 401 for invalid webhook signature');

  // 3. Webhook with valid signature -> 200
  const timestamp = String(Math.floor(Date.now() / 1000));
  const payload = JSON.stringify({
    event: 'payment.captured',
    payload: { payment: { entity: { id: 'pay_test_123', amount: 49900, status: 'captured' } } },
  });
  const validSignature = crypto
    .createHmac('sha256', SECRET)
    .update(`${timestamp}.${payload}`)
    .digest('hex');

  const resValid = await fetch(`${BASE_URL}/api/v1/webhooks/razorpay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': validSignature,
      'X-Webhook-Timestamp': timestamp,
    },
    body: payload,
  });
  const dataValid = await resValid.json();
  console.log('Webhook with valid HMAC signature:', resValid.status, dataValid);
  if (resValid.status !== 200 || !dataValid.received) throw new Error('Expected 200 for valid webhook');

  // 4. Test Rate limit headers present on login
  const resRateLimit = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@vertex.test', password: 'test' }),
  });
  const limitHeader = resRateLimit.headers.get('x-ratelimit-limit');
  const remainingHeader = resRateLimit.headers.get('x-ratelimit-remaining');
  console.log('Rate Limit Headers:', {
    'X-RateLimit-Limit': limitHeader,
    'X-RateLimit-Remaining': remainingHeader,
  });
  if (!limitHeader || !remainingHeader) throw new Error('Expected RateLimit headers on login');

  console.log('\n🎉 ALL WEBHOOK & RATE LIMIT SECURITY TESTS PASSED!\n');
}

testWebhooksAndRateLimit().catch((err) => {
  console.error('Webhook & Rate Limit test failure:', err);
  process.exit(1);
});
