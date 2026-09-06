import { Request, Response, NextFunction } from 'express';
import { verifyAuthToken, getFullUserById, logAuditEvent } from './auth.js';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * Authentication Middleware: Extracts token from Authorization header or cookie,
 * verifies it against the database, and injects user with permissions into req.user.
 */
export async function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or malformed authorization header. Please log in.',
        },
      });
    }

    const token = authHeader.substring(7).trim();
    const payload = verifyAuthToken(token);
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Authentication session has expired or is invalid. Please sign in again.',
        },
      });
    }

    const user = await getFullUserById(payload.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Authenticated user account does not exist or has been deleted.',
        },
      });
    }

    if (user.status === 'INACTIVE' || user.status === 'SUSPENDED' || user.status === 'DELETED') {
      await logAuditEvent({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        entity: 'AUTH',
        oldValue: { status: user.status },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: `Your account is currently ${user.status.toLowerCase()}. Please contact system administration.`,
        },
      });
    }

    req.user = user;
    next();
  } catch (err: any) {
    console.error('Auth middleware failure:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_AUTH_ERROR',
        message: 'Internal error verifying authentication credentials.',
      },
    });
  }
}

/**
 * Require specific role or roles
 */
export function requireRole(allowedRoles: string | string[]) {
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      });
    }

    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!rolesArray.includes(req.user.role)) {
      logAuditEvent({
        userId: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        entity: 'RBAC',
        newValue: { requiredRoles: rolesArray, userRole: req.user.role },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires one of the following roles: ${rolesArray.join(', ')}.`,
        },
      });
    }

    next();
  };
}

/**
 * Require a specific permission code
 */
export function requirePermission(permissionCode: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      });
    }

    // Super Admin has all permissions unconditionally
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!req.user.permissions?.includes(permissionCode)) {
      logAuditEvent({
        userId: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        entity: 'PERMISSION',
        newValue: { missingPermission: permissionCode },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Forbidden: You do not possess the '${permissionCode}' capability required for this operation.`,
        },
      });
    }

    next();
  };
}

/**
 * Require location scope (City or Hub level)
 */
export function requireLocationScope() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      });
    }

    // Super Admin has all-India access
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Attached location scope IDs
    const userCityId = req.user.cityId;
    const scopedCityIds = (req.user.locationScopes || [])
      .map((s: any) => s.city_id)
      .filter(Boolean);

    req.user.accessibleCityIds = Array.from(new Set([userCityId, ...scopedCityIds].filter(Boolean)));
    next();
  };
}
