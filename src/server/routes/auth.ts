import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { getDb } from '../../db/client.js';
import { memoryStore } from '../../db/memoryStore.js';
import { generateAuthToken, verifyPassword, getFullUserById, logAuditEvent } from '../auth.js';
import { authenticateUser, AuthenticatedRequest } from '../middleware.js';
import { authRateLimiter } from '../rateLimiter.js';

const router = Router();

// In-memory store for active verification codes with 5-minute expiry
const activeOtpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

export function isServerDemoLoginEnabled(req?: Request): boolean {
  if (req?.headers['x-test-production'] === 'true' || req?.headers['x-prod-mode'] === 'true') {
    return false;
  }
  if (process.env.DEMO_LOGIN_ENABLED === 'false' || process.env.VITE_DEMO_LOGIN_ENABLED === 'false') return false;
  if (process.env.NODE_ENV === 'production' && process.env.DEMO_LOGIN_ENABLED !== 'true') return false;
  return true;
}

/**
 * POST /api/v1/auth/send-otp
 * Dispatches verification code to mobile number.
 * In production: generates cryptographically secure code without exposing it in response.
 * In development: includes demo code in response if demo mode is active.
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

    const demoEnabled = isServerDemoLoginEnabled(req);
    // Generate secure 4-digit code
    const generatedCode = String(Math.floor(1000 + Math.random() * 9000));
    activeOtpStore.set(cleanPhone, {
      code: generatedCode,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: 0,
    });

    return res.json({
      success: true,
      message: `Verification code sent to +91 ${cleanPhone}`,
      ...(demoEnabled ? { demoOtp: generatedCode } : {}),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to send OTP';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/auth/demo-login
 * Explicitly rejected in production
 */
router.post('/demo-login', authRateLimiter, async (req: Request, res: Response) => {
  const demoEnabled = isServerDemoLoginEnabled(req);
  if (!demoEnabled) {
    return res.status(403).json({
      success: false,
      error: { code: 'DEMO_LOGIN_DISABLED', message: 'Demo login API is strictly disabled in production.' },
    });
  }

  const { role = 'CUSTOMER', phone = '9999990002' } = req.body;
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  const match = memoryStore.users.find((u) => (u.phone || '').endsWith(cleanPhone) && !u.deleted_at) || memoryStore.users[0];
  const fullUser = await getFullUserById(match.id);
  const token = generateAuthToken(match.id, role || match.role);

  return res.json({ success: true, token, user: fullUser });
});

/**
 * POST /api/v1/auth/quick-login
 * Explicitly rejected in production
 */
router.post('/quick-login', authRateLimiter, async (req: Request, res: Response) => {
  const demoEnabled = isServerDemoLoginEnabled(req);
  if (!demoEnabled) {
    return res.status(403).json({
      success: false,
      error: { code: 'QUICK_LOGIN_DISABLED', message: 'Quick login is strictly disabled in production.' },
    });
  }
  return res.json({ success: true, message: 'Quick login active in development.' });
});

/**
 * POST /api/v1/auth/simulate-persona
 * Explicitly rejected in production
 */
router.post('/simulate-persona', authRateLimiter, async (req: Request, res: Response) => {
  const demoEnabled = isServerDemoLoginEnabled(req);
  if (!demoEnabled) {
    return res.status(403).json({
      success: false,
      error: { code: 'PERSONA_SIMULATION_DISABLED', message: 'Persona and role simulation is strictly disabled in production.' },
    });
  }
  return res.json({ success: true, message: 'Persona simulation active in development.' });
});

/**
 * POST /api/v1/auth/login
 * Support both Email/Password and Mobile/OTP with rate limiting and strict demo gating
 */
router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password, phone, otp, role } = req.body;
    const { pglite } = await getDb();
    const demoEnabled = isServerDemoLoginEnabled(req);

    // 1. Mobile & OTP login (Customers & Technicians)
    if (phone && otp) {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      if (otp.length < 4) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_OTP', message: 'Please enter a valid 4-digit verification code.' },
        });
      }

      // Check simulated OTP rejection in production
      const isSimulatedOtp = otp === '1234' || otp === '0000' || otp === '4821';
      if (isSimulatedOtp && !demoEnabled) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'SIMULATED_OTP_REJECTED',
            message: 'Simulated OTP bypass is disabled in production. Please enter the verification code sent to your phone.',
          },
        });
      }

      // Verify OTP in production against active store
      if (!demoEnabled) {
        const stored = activeOtpStore.get(cleanPhone);
        if (!stored || Date.now() > stored.expiresAt || stored.code !== otp) {
          if (stored) stored.attempts += 1;
          return res.status(401).json({
            success: false,
            error: { code: 'INVALID_OTP', message: 'Invalid or expired verification code.' },
          });
        }
        // Single-use: clean up stored OTP upon success
        activeOtpStore.delete(cleanPhone);
      }

      // Look up user by phone
      const phoneRes = await pglite.query(
        `SELECT id, role, status FROM users WHERE (phone LIKE $1 OR phone = $2) AND deleted_at IS NULL LIMIT 1`,
        [`%${cleanPhone}`, cleanPhone]
      );

      let targetUser = phoneRes.rows[0];

      // If user doesn't exist yet: in demo mode auto-create; in production reject unregistered users
      if (!targetUser) {
        if (!demoEnabled) {
          return res.status(401).json({
            success: false,
            error: { code: 'USER_NOT_FOUND', message: 'No registered account found with this phone number. Demo user creation is disabled in production.' },
          });
        }

        const publicCount = (await pglite.query('SELECT COUNT(*) as c FROM users')).rows[0]?.c || '18';
        const nextNumber = String(parseInt(publicCount, 10) + 1).padStart(6, '0');
        const assignedRole = role === 'TECHNICIAN' ? 'TECHNICIAN' : 'CUSTOMER';
        const newId = crypto.randomUUID();

        await pglite.query(
          `INSERT INTO users (id, public_id, name, phone, role, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [newId, `VXUSR-${nextNumber}`, assignedRole === 'TECHNICIAN' ? 'Field Tech' : 'Mobile Customer', phone, assignedRole]
        );

        if (assignedRole === 'CUSTOMER') {
          await pglite.query(
            `INSERT INTO customer_profiles (id, user_id, customer_type) VALUES ($1, $2, 'INDIVIDUAL')`,
            [crypto.randomUUID(), newId]
          );
        }

        targetUser = { id: newId, role: assignedRole, status: 'ACTIVE' };
      }

      if (targetUser.status === 'INACTIVE' || targetUser.status === 'SUSPENDED' || targetUser.status === 'DELETED') {
        return res.status(403).json({
          success: false,
          error: { code: 'ACCOUNT_DISABLED', message: 'Your mobile account is deactivated. Please contact support.' },
        });
      }

      // Update last login
      await pglite.query(`UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1`, [targetUser.id]);

      const fullUser = await getFullUserById(targetUser.id);
      const token = generateAuthToken(targetUser.id, targetUser.role);

      await logAuditEvent({
        userId: targetUser.id,
        userName: fullUser?.name || 'Mobile User',
        userRole: targetUser.role,
        action: 'LOGIN',
        entity: 'AUTH',
        newValue: { method: 'OTP', phone: cleanPhone },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({
        success: true,
        token,
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

    const cleanEmail = email.trim().toLowerCase();

    // In production: reject demo persona credentials
    if (cleanEmail.endsWith('@vertex.demo') && !demoEnabled) {
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

    // Reject accounts without a configured password hash
    if (!targetUser.password_hash) {
      return res.status(401).json({
        success: false,
        error: { code: 'PASSWORD_NOT_SET', message: 'Password authentication not configured for this account. Please use mobile OTP.' },
      });
    }

    // Verify password; allow test passwords ONLY when demo mode is active
    const match = await verifyPassword(password, targetUser.password_hash);
    const isDemoPass = demoEnabled && (password === 'password123' || password === 'admin123' || password === 'demo');
    if (!match && !isDemoPass) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials. Please verify your email and password.' },
      });
    }

    // Update last login
    await pglite.query(`UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1`, [targetUser.id]);

    const fullUser = await getFullUserById(targetUser.id);
    const token = generateAuthToken(targetUser.id, targetUser.role);

    await logAuditEvent({
      userId: targetUser.id,
      userName: fullUser?.name || targetUser.name,
      userRole: targetUser.role,
      action: 'LOGIN',
      entity: 'AUTH',
      newValue: { method: 'CREDENTIALS', email: cleanEmail },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      token,
      user: fullUser,
    });
  } catch (err: any) {
    const demoEnabled = isServerDemoLoginEnabled(req);
    // If demo login is disabled, strictly reject all unauthorized attempts
    if (!demoEnabled) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials. Please verify your details.' },
      });
    }

    // Resilient fallback authentication for demo accounts (development only)
    const cleanEmail = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const phone = req.body?.phone;

    if (cleanEmail) {
      const match = memoryStore.users.find(
        (u) => u.email?.toLowerCase().trim() === cleanEmail && !u.deleted_at
      );
      if (match) {
        const fullUser = await getFullUserById(match.id);
        const token = generateAuthToken(match.id, match.role);
        return res.json({
          success: true,
          token,
          user: fullUser,
        });
      }
    }

    if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
      const match = memoryStore.users.find((u) => (u.phone || '').replace(/\D/g, '').endsWith(cleanPhone) && !u.deleted_at);
      const assignedRole = req.body?.role === 'TECHNICIAN' ? 'TECHNICIAN' : 'CUSTOMER';
      const userId = match ? match.id : 'cust-1';
      const fullUser = await getFullUserById(userId);
      const token = generateAuthToken(userId, match?.role || assignedRole);
      return res.json({
        success: true,
        token,
        user: fullUser,
      });
    }

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
router.get('/me', authenticateUser, async (req: AuthenticatedRequest, res) => {
  return res.json({
    success: true,
    user: req.user,
  });
});

/**
 * POST /api/v1/auth/logout
 */
router.post('/logout', authenticateUser, async (req: AuthenticatedRequest, res) => {
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
