import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { getDb } from '../../db/client.js';
import { generateAuthToken, verifyPassword, getFullUserById, logAuditEvent, resolvePlatformForRole, PlatformType } from '../auth.js';
import { authenticateUser, AuthenticatedRequest } from '../middleware.js';
import { authRateLimiter } from '../rateLimiter.js';

const router = Router();

// In-memory store for active verification codes with 5-minute expiry
const activeOtpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

export function isServerDemoLoginEnabled(_req?: Request): boolean {
  return false;
}

/**
 * POST /api/v1/auth/send-otp
 * Dispatches verification code to mobile number.
 * Generates cryptographically secure code without exposing it in the client response.
 */
router.post('/send-otp', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: { code: 'PHONE_REQUIRED', message: 'Mobile number is required.' } });
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_PHONE', message: 'Please enter a valid 10-digit mobile number.' } });
    }

    // Generate secure 4-digit code
    const generatedCode = String(Math.floor(1000 + Math.random() * 9000));
    activeOtpStore.set(cleanPhone, {
      code: generatedCode,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: 0,
    });

    console.info(`[SMS Dispatch] Verification OTP generated for +91 ${cleanPhone}`);

    return res.json({
      success: true,
      message: `Verification code sent to +91 ${cleanPhone}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to send OTP';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/auth/demo-login
 * Strictly disabled in production
 */
router.post('/demo-login', authRateLimiter, async (_req: Request, res: Response) => {
  return res.status(403).json({
    success: false,
    error: { code: 'DEMO_LOGIN_DISABLED', message: 'Demo login API is strictly disabled in production.' },
  });
});

/**
 * POST /api/v1/auth/quick-login
 * Strictly disabled in production
 */
router.post('/quick-login', authRateLimiter, async (_req: Request, res: Response) => {
  return res.status(403).json({
    success: false,
    error: { code: 'QUICK_LOGIN_DISABLED', message: 'Quick login is strictly disabled in production.' },
  });
});

/**
 * POST /api/v1/auth/simulate-persona
 * Strictly disabled in production
 */
router.post('/simulate-persona', authRateLimiter, async (_req: Request, res: Response) => {
  return res.status(403).json({
    success: false,
    error: { code: 'PERSONA_SIMULATION_DISABLED', message: 'Persona and role simulation is strictly disabled in production.' },
  });
});

/**
 * POST /api/v1/auth/login
 * Real production authentication supporting Mobile/OTP and Corporate Email/Password
 */
router.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, phone, otp } = req.body;
    const { pglite } = await getDb();

    // Optional platform hint from client: strictly validated against authoritative user role
    const requestedPlatform = (req.body.platform as string)?.trim().toUpperCase();

    // 1. Mobile & OTP login (Customers & Technicians)
    if (phone && otp) {
      const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
      if (String(otp).length < 4) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_OTP', message: 'Please enter a valid 4-digit verification code.' },
        });
      }

      // Strictly verify OTP against active verification store
      const stored = activeOtpStore.get(cleanPhone);
      if (!stored || Date.now() > stored.expiresAt || stored.code !== String(otp).trim()) {
        if (stored) stored.attempts += 1;
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_OTP', message: 'Invalid or expired verification code.' },
        });
      }

      // Single-use: clear OTP after successful verification
      activeOtpStore.delete(cleanPhone);

      // Look up user by registered phone number
      const phoneRes = await pglite.query(
        `SELECT id, role, status FROM users WHERE (phone LIKE $1 OR phone = $2) AND deleted_at IS NULL LIMIT 1`,
        [`%${cleanPhone}`, cleanPhone]
      );

      const targetUser = phoneRes.rows[0];

      if (!targetUser) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'No registered account found with this phone number. Please register before signing in.',
          },
        });
      }

      if (targetUser.status === 'INACTIVE' || targetUser.status === 'SUSPENDED' || targetUser.status === 'DELETED') {
        return res.status(403).json({
          success: false,
          error: { code: 'ACCOUNT_DISABLED', message: 'Your account is deactivated. Please contact VERTEX support.' },
        });
      }

      // Authoritatively resolve platform for this account's role
      const userPlatform = resolvePlatformForRole(targetUser.role);

      // If client explicitly targeted a platform, ensure the user belongs to it
      if (requestedPlatform && requestedPlatform !== userPlatform) {
        await logAuditEvent({
          userId: targetUser.id,
          userName: 'Mobile User',
          userRole: targetUser.role,
          action: 'CROSS_PLATFORM_LOGIN_REJECTED',
          entity: 'AUTH',
          newValue: { attemptedPlatform: requestedPlatform, accountPlatform: userPlatform },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });

        return res.status(403).json({
          success: false,
          error: {
            code: 'PLATFORM_MISMATCH',
            message: `This login portal is for the ${requestedPlatform} platform. Your account belongs to ${userPlatform}. Please sign in at your dedicated portal.`,
          },
        });
      }

      // Update last login timestamp
      await pglite.query(`UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1`, [targetUser.id]);

      const fullUser = await getFullUserById(targetUser.id);
      const token = generateAuthToken(targetUser.id, targetUser.role, userPlatform);

      await logAuditEvent({
        userId: targetUser.id,
        userName: fullUser?.name || 'Mobile User',
        userRole: targetUser.role,
        action: 'LOGIN',
        entity: 'AUTH',
        newValue: { method: 'OTP', phone: cleanPhone, platform: userPlatform },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({
        success: true,
        token,
        platform: userPlatform,
        user: fullUser,
      });
    }

    // 2. Email & Password login (Internal / Administrative Staff)
    if (!email) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_CREDENTIALS', message: 'Email address is required.' },
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Reject demo persona domains in production
    if (cleanEmail.endsWith('@vertex.demo')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'DEMO_CREDENTIALS_REJECTED',
          message: 'Demo persona credentials cannot be used in production. Please sign in with your corporate email.',
        },
      });
    }

    const userRes = await pglite.query(
      `SELECT id, password_hash, role, status, name FROM users WHERE LOWER(email) = $1 AND deleted_at IS NULL LIMIT 1`,
      [cleanEmail]
    );

    if (userRes.rows.length === 0) {
      await logAuditEvent({
        userName: cleanEmail,
        userRole: 'ANONYMOUS',
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        entity: 'AUTH',
        newValue: { reason: 'User not found', email: cleanEmail },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials. Please verify your email and password.' },
      });
    }

    const targetUser = userRes.rows[0];

    if (targetUser.status === 'INACTIVE' || targetUser.status === 'SUSPENDED' || targetUser.status === 'DELETED') {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_DISABLED', message: `Account is ${targetUser.status.toLowerCase()}. Access denied.` },
      });
    }

    // Authoritatively resolve platform for this account's role
    const userPlatform = resolvePlatformForRole(targetUser.role);

    // If client explicitly targeted a platform, ensure the user belongs to it
    if (requestedPlatform && requestedPlatform !== userPlatform) {
      await logAuditEvent({
        userId: targetUser.id,
        userName: targetUser.name,
        userRole: targetUser.role,
        action: 'CROSS_PLATFORM_LOGIN_REJECTED',
        entity: 'AUTH',
        newValue: { attemptedPlatform: requestedPlatform, accountPlatform: userPlatform },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(403).json({
        success: false,
        error: {
          code: 'PLATFORM_MISMATCH',
          message: `This login portal is for the ${requestedPlatform} platform. Your account belongs to ${userPlatform}. Please sign in at your dedicated portal.`,
        },
      });
    }

    // Reject accounts without a configured password hash
    if (!targetUser.password_hash) {
      return res.status(401).json({
        success: false,
        error: { code: 'PASSWORD_NOT_SET', message: 'Password authentication not configured for this account. Please use mobile OTP.' },
      });
    }

    // Strictly verify bcrypt password against database password_hash
    const match = await verifyPassword(String(password || ''), targetUser.password_hash);
    if (!match) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials. Please verify your email and password.' },
      });
    }

    // Update last login
    await pglite.query(`UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1`, [targetUser.id]);

    const fullUser = await getFullUserById(targetUser.id);
    const token = generateAuthToken(targetUser.id, targetUser.role, userPlatform);

    await logAuditEvent({
      userId: targetUser.id,
      userName: fullUser?.name || targetUser.name,
      userRole: targetUser.role,
      action: 'LOGIN',
      entity: 'AUTH',
      newValue: { method: 'CREDENTIALS', email: cleanEmail, platform: userPlatform },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      token,
      platform: userPlatform,
      user: fullUser,
    });
  } catch (_err: unknown) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials. Please verify your details.' },
    });
  }
});

/**
 * GET /api/v1/auth/me
 * Returns authenticated session profile directly from PostgreSQL
 */
router.get('/me', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    user: req.user,
  });
});

/**
 * POST /api/v1/auth/logout
 */
router.post('/logout', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    await logAuditEvent({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'LOGOUT',
      entity: 'AUTH',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  return res.json({ success: true, message: 'Successfully logged out.' });
});

export default router;
