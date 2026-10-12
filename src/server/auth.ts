import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDb } from '../db/client.js';
import { memoryStore } from '../db/memoryStore.js';

export function getJwtSecret(): string {
  if (process.env.NODE_ENV === 'production') {
    const secret = process.env.JWT_SECRET?.trim();
    if (!secret || secret.length < 16) {
      throw new Error('[CRITICAL] Missing or invalid JWT_SECRET in production. Minimum 16 characters required.');
    }
    return secret;
  }
  return process.env.JWT_SECRET || 'vertex_dev_local_jwt_secret_only';
}

export type PlatformType = 'BUSINESS' | 'CUSTOMER' | 'PARTNER';

export const PLATFORM_ROLES: Record<PlatformType, readonly string[]> = {
  BUSINESS: [
    'SUPER_ADMIN',
    'ADMIN',
    'MANAGER',
    'FINANCE',
    'SALES',
    'SALES_TEAM',
    'MARKETING',
    'OPERATIONS',
    'SUPPORT',
    'HR',
    'PAYROLL',
    'EMPLOYEE',
  ],
  CUSTOMER: ['CUSTOMER'],
  PARTNER: ['TECHNICIAN', 'PARTNER'],
} as const;

/**
 * Determine authoritatively which platform a role belongs to.
 * Throws error if role is unrecognized or unauthorized.
 */
export function resolvePlatformForRole(role: string): PlatformType {
  const normRole = (role || '').trim().toUpperCase();
  if (normRole === 'CUSTOMER') return 'CUSTOMER';
  if (normRole === 'TECHNICIAN' || normRole === 'PARTNER') return 'PARTNER';
  if ((PLATFORM_ROLES.BUSINESS as readonly string[]).includes(normRole)) return 'BUSINESS';
  throw new Error(`Invalid or unrecognized role for platform assignment: ${role}`);
}

export interface TokenPayload {
  userId: string;
  role: string;
  platform: PlatformType;
  expiresAt: number;
}

/**
 * Generate authenticated bearer token for user with immutable platform claim.
 * Supports flexible signatures:
 * - generateAuthToken(userId, role, platform, expiresInMs)
 * - generateAuthToken(userId, role, expiresInMs)
 */
export function generateAuthToken(
  userId: string,
  role: string,
  platformOrExpiresIn?: PlatformType | number,
  expiresInMs: number = 24 * 60 * 60 * 1000
): string {
  let resolvedPlatform: PlatformType;
  let actualExpiresInMs: number;

  if (typeof platformOrExpiresIn === 'number') {
    resolvedPlatform = resolvePlatformForRole(role);
    actualExpiresInMs = platformOrExpiresIn;
  } else {
    resolvedPlatform = platformOrExpiresIn || resolvePlatformForRole(role);
    actualExpiresInMs = expiresInMs;
  }

  const secretKey = getJwtSecret();
  const expiresAt = Date.now() + actualExpiresInMs;
  const payload: TokenPayload = { userId, role, platform: resolvedPlatform, expiresAt };
  const json = JSON.stringify(payload);
  const base64 = Buffer.from(json).toString('base64url');
  const hmac = crypto.createHmac('sha256', secretKey).update(base64).digest('base64url');
  return `vtx_${base64}.${hmac}`;
}

/**
 * Verify token and extract payload with platform validation
 */
export function verifyAuthToken(token: string): TokenPayload | null {
  try {
    if (!token.startsWith('vtx_') || token.startsWith('vtx_local_')) return null;

    const raw = token.slice(4);
    const [base64, signature] = raw.split('.');
    if (!base64 || !signature) return null;

    const secretKey = getJwtSecret();
    const expectedHmac = crypto.createHmac('sha256', secretKey).update(base64).digest('base64url');
    if (signature !== expectedHmac) return null;

    const json = Buffer.from(base64, 'base64url').toString('utf8');
    const payload: TokenPayload = JSON.parse(json);

    if (Date.now() > payload.expiresAt) return null;

    // Validate platform claim is strictly one of the allowed platform types
    if (!payload.platform || !['BUSINESS', 'CUSTOMER', 'PARTNER'].includes(payload.platform)) {
      // Backward compatibility for tokens minted before platform isolation:
      // Authoritatively derive from role if missing
      if (payload.role) {
        payload.platform = resolvePlatformForRole(payload.role);
      } else {
        return null;
      }
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Hash password securely
 */
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, 10);
}

/**
 * Verify password
 */
export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

/**
 * Load full User with Role, Permissions, City, Location Scopes, and Profile
 */
export async function getFullUserById(userId: string) {
  try {
    const { pglite } = await getDb();

    const userRes = await pglite.query(
      `SELECT u.*, c.name as city_name, r.name as role_name
       FROM users u
       LEFT JOIN cities c ON u.city_id = c.id
       LEFT JOIN roles r ON u.role = r.code
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [userId]
    );

    if (!userRes || userRes.rows.length === 0) {
      if (process.env.NODE_ENV === 'production') {
        return null;
      }
      const memUser = memoryStore.users.find((u) => u.id === userId || u.public_id === userId);
      if (memUser) {
        let perms: string[];
        if (memUser.role === 'SUPER_ADMIN') {
          perms = memoryStore.permissions.map((p) => p.code);
        } else {
          const rolePerms = memoryStore.rolePermissions
            .filter((rp) => rp.role_code === memUser.role)
            .map((rp) => rp.permission_code);
          const customPerms = (memoryStore.userPermissions || [])
            .filter((up) => up.user_id === memUser.id)
            .map((up) => up.permission_code);
          perms = Array.from(new Set([...rolePerms, ...customPerms]));
        }
        return {
          id: memUser.id,
          publicId: memUser.public_id,
          name: memUser.name,
          email: memUser.email,
          phone: memUser.phone,
          role: memUser.role,
          roleName: memUser.role,
          status: memUser.status,
          cityId: memUser.city_id,
          cityName: 'Gurgaon',
          profileImage: memUser.profile_image,
          createdAt: memUser.created_at,
          updatedAt: memUser.updated_at,
          lastLoginAt: memUser.last_login_at,
          permissions: perms,
          locationScopes: [],
          profile: null,
          platform: resolvePlatformForRole(memUser.role),
        };
      }
      return null;
    }
    const rawUser = userRes.rows[0];

    // Fetch permissions for this user's role
    let rolePermissions: string[] = [];
    if (rawUser.role === 'SUPER_ADMIN') {
      const allPermRes = await pglite.query(`SELECT code FROM permissions`).catch(() => null);
      if (allPermRes && allPermRes.rows.length > 0) {
        rolePermissions = allPermRes.rows.map((r: any) => r.code);
      } else {
        rolePermissions = process.env.NODE_ENV === 'production' ? [] : memoryStore.permissions.map((p) => p.code);
      }
    } else {
      const permRes = await pglite.query(
        `SELECT permission_code FROM role_permissions WHERE role_code = $1`,
        [rawUser.role]
      );
      rolePermissions = permRes ? permRes.rows.map((r: any) => r.permission_code) : [];
    }

    // Fetch granular custom permissions for this user
    const userPermRes = await pglite.query(
      `SELECT permission_code FROM user_permissions WHERE user_id = $1`,
      [userId]
    ).catch(() => ({ rows: [] }));
    const customUserPermissions: string[] = userPermRes ? userPermRes.rows.map((r: any) => r.permission_code) : [];

    const permissions: string[] = Array.from(new Set([...rolePermissions, ...customUserPermissions]));

    // Fetch location scopes
    const scopeRes = await pglite.query(
      `SELECT uls.*, c.name as city_name
       FROM user_location_scopes uls
       LEFT JOIN cities c ON uls.city_id = c.id
       WHERE uls.user_id = $1`,
      [userId]
    );

    // Fetch role-specific profile
    let profile: any = null;
    if (rawUser.role === 'SALES') {
      const p = await pglite.query(`SELECT * FROM sales_profiles WHERE user_id = $1`, [userId]);
      profile = p?.rows[0] || null;
    } else if (rawUser.role === 'TECHNICIAN') {
      const p = await pglite.query(`SELECT * FROM technician_profiles WHERE user_id = $1`, [userId]);
      profile = p?.rows[0] || null;
    } else if (rawUser.role === 'MANAGER') {
      const p = await pglite.query(`SELECT * FROM manager_profiles WHERE user_id = $1`, [userId]);
      profile = p?.rows[0] || null;
    } else if (rawUser.role === 'FINANCE') {
      const p = await pglite.query(`SELECT * FROM finance_profiles WHERE user_id = $1`, [userId]);
      profile = p?.rows[0] || null;
    } else if (rawUser.role === 'CUSTOMER') {
      const p = await pglite.query(`SELECT * FROM customer_profiles WHERE user_id = $1`, [userId]);
      profile = p?.rows[0] || null;
    }

    return {
      id: rawUser.id,
      publicId: rawUser.public_id,
      name: rawUser.name,
      email: rawUser.email,
      phone: rawUser.phone,
      role: rawUser.role,
      roleName: rawUser.role_name || rawUser.role,
      status: rawUser.status,
      cityId: rawUser.city_id,
      cityName: rawUser.city_name || 'All India',
      profileImage: rawUser.profile_image,
      createdAt: rawUser.created_at,
      updatedAt: rawUser.updated_at,
      lastLoginAt: rawUser.last_login_at,
      permissions: permissions.length > 0
        ? permissions
        : (process.env.NODE_ENV === 'production'
            ? []
            : memoryStore.rolePermissions.filter(rp => rp.role_code === rawUser.role).map(rp => rp.permission_code)),
      locationScopes: scopeRes ? scopeRes.rows : [],
      profile,
      platform: resolvePlatformForRole(rawUser.role),
    };
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Database Auth Failure in Production]:', err);
      return null;
    }
    const memUser = memoryStore.users.find((u) => u.id === userId || u.public_id === userId);
    if (memUser) {
      const perms = memoryStore.rolePermissions
        .filter((rp) => rp.role_code === memUser.role)
        .map((rp) => rp.permission_code);
      return {
        id: memUser.id,
        publicId: memUser.public_id,
        name: memUser.name,
        email: memUser.email,
        phone: memUser.phone,
        role: memUser.role,
        roleName: memUser.role,
        status: memUser.status,
        cityId: memUser.city_id,
        cityName: 'Gurgaon',
        profileImage: memUser.profile_image,
        createdAt: memUser.created_at,
        updatedAt: memUser.updated_at,
        lastLoginAt: memUser.last_login_at,
        permissions: perms,
        locationScopes: [],
        profile: null,
      };
    }
    return null;
  }
}

/**
 * Record immutable Audit Log entry
 * Note: Never store passwords, hashes, or secret tokens.
 */
export async function logAuditEvent(params: {
  userId?: string | null;
  userName: string;
  userRole: string;
  action: string;
  entity?: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    const { pglite } = await getDb();

    // Sanitize objects to ensure no sensitive fields (passwords, OTPs, tokens, keys) are stored
    const sanitize = (val: any) => {
      if (!val) return null;
      if (typeof val !== 'object') return typeof val === 'string' ? val : JSON.stringify(val);
      const copy = { ...val };
      const sensitiveKeys = [
        'password',
        'password_hash',
        'passwordHash',
        'token',
        'jwt',
        'accessToken',
        'refreshToken',
        'otp',
        'code',
        'secret',
        'apiKey',
        'key',
        'webhook_secret',
        'privateKey',
        'private_key',
      ];
      for (const k of sensitiveKeys) {
        delete copy[k];
      }
      return JSON.stringify(copy);
    };

    await pglite.query(
      `INSERT INTO audit_logs (id, user_id, user_name, user_role, action, entity, entity_id, old_value, new_value, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)`,
      [
        crypto.randomUUID(),
        params.userId || null,
        params.userName,
        params.userRole,
        params.action,
        params.entity || 'USER',
        params.entityId || null,
        sanitize(params.oldValue),
        sanitize(params.newValue),
        params.ipAddress || '127.0.0.1',
        params.userAgent || 'VERTEX-Client',
      ]
    );
  } catch {
    // Non-blocking background audit write
  }
}
