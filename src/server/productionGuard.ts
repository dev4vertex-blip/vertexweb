import { testDatabaseConnection } from '../db/client.js';

/**
 * Production Environment Safety Guard
 * Enforces mandatory secrets, database configuration, and security controls at startup.
 * In production (NODE_ENV=production): FAILS FAST if any mandatory configuration is missing.
 */
export async function validateProductionEnvironment(): Promise<void> {
  const env = (process.env.NODE_ENV || 'development').trim().toLowerCase();
  const isEnforced = env === 'production' || env === 'staging';
  if (!isEnforced) {
    return;
  }

  const errors: string[] = [];

  // 1. Mandatory DATABASE_URL
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (!dbUrl) {
    errors.push('DATABASE_URL is not configured.');
  } else if (dbUrl.includes('[YOUR-PASSWORD]')) {
    errors.push('DATABASE_URL contains placeholder [YOUR-PASSWORD].');
  }

  // 2. Mandatory JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (!jwtSecret) {
    errors.push('JWT_SECRET is not configured.');
  } else if (
    jwtSecret === 'vertex_enterprise_session_secret_key_2026' ||
    jwtSecret === 'replace-with-cryptographically-secure-random-secret-in-production' ||
    jwtSecret === 'vertex_dev_local_jwt_secret_only' ||
    jwtSecret.length < 16
  ) {
    errors.push('JWT_SECRET must be a cryptographically secure key of at least 16 characters in production.');
  }

  // 3. Mandatory Webhook Secret
  const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET?.trim() || process.env.WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    errors.push('PAYMENT_WEBHOOK_SECRET is not configured for payment verification.');
  } else if (webhookSecret === 'vertex_payment_webhook_secret_key_2026') {
    errors.push('PAYMENT_WEBHOOK_SECRET must not use insecure default placeholder.');
  }

  // 4. Prohibit demo flags in production
  if (process.env.DEMO_LOGIN_ENABLED === 'true') {
    errors.push('DEMO_LOGIN_ENABLED must be false in production.');
  }
  if (process.env.VITE_DEMO_LOGIN_ENABLED === 'true') {
    errors.push('VITE_DEMO_LOGIN_ENABLED must be false in production.');
  }

  if (errors.length > 0) {
    const errorBanner = [
      '================================================================================',
      '[CRITICAL PRODUCTION CONFIGURATION ERROR]',
      'Server startup aborted. The following mandatory production configurations failed:',
      ...errors.map((err) => `  - ${err}`),
      '================================================================================',
    ].join('\n');

    console.error(errorBanner);
    throw new Error(`Production environment validation failed:\n${errors.join('\n')}`);
  }

  // 5. Verify live database connection in production
  const dbCheck = await testDatabaseConnection();
  if (!dbCheck.connected) {
    const dbErrorBanner = [
      '================================================================================',
      '[CRITICAL DATABASE AVAILABILITY ERROR]',
      'Server startup aborted in production. PostgreSQL database is offline or unreachable:',
      `  - ${dbCheck.message}`,
      'In-memory fallback (memoryStore) is strictly disabled in production.',
      '================================================================================',
    ].join('\n');

    console.error(dbErrorBanner);
    throw new Error(`Production database connection failed:\n${dbCheck.message}`);
  }

  console.info('[Security Guard] Production environment and database connection validated successfully.');
}
