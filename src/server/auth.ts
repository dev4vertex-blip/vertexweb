import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDb } from '../db/client.js';
import { memoryStore } from '../db/memoryStore.js';

const SECRET_KEY = process.env.JWT_SECRET || 'vertex_enterprise_session_secret_key_2026';

export interface TokenPayload {
  userId: string;
  role: string;
  expiresAt: number;
}

/**
 * Generate authenticated bearer token for user
 */
export function generateAuthToken(userId: string, role: string): string {
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  const payload: TokenPayload = { userId, role, expiresAt };
  const json = JSON.stringify(payload);
  const base64 = Buffer.from(json).toString('base64url');
  const hmac = crypto.createHmac('sha256', SECRET_KEY).update(base64).digest('base64url');
  return `vtx_${base64}.${hmac}`;
}

/**
 * Verify token and extract payload
 */
export function verifyAuthToken(token: string): TokenPayload | null {
  try {
    if (!token.startsWith('vtx_')) return null;
    const raw = token.slice(4);
    const [base64, signature] = raw.split('.');
    if (!base64 || !signature) return null;

    const expectedHmac = crypto.createHmac('sha256', SECRET_KEY).update(base64).digest('base64url');
    if (signature !== expectedHmac) return null;

    const json = Buffer.from(base64, 'base64url').toString('utf8');
    const payload: TokenPayload = JSON.parse(json);

    if (Date.now() > payload.expiresAt) return null;

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
    const rawUser = userRes.rows[0];

    // Fetch permissions for this user's role
    const permRes = await pglite.query(
      `SELECT permission_code FROM role_permissions WHERE role_code = $1`,
      [rawUser.role]
    );
    const permissions: string[] = permRes ? permRes.rows.map((r: any) => r.permission_code) : [];

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
      permissions: permissions.length > 0 ? permissions : memoryStore.rolePermissions.filter(rp => rp.role_code === rawUser.role).map(rp => rp.permission_code),
      locationScopes: scopeRes ? scopeRes.rows : [],
      profile,
    };
  } catch {
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
