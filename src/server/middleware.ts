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

const PERMISSION_ALIASES: Record<string, string[]> = {
  USER_UPDATE: ['USER_EDIT'],
  USER_EDIT: ['USER_UPDATE'],
  CUSTOMER_UPDATE: ['CUSTOMER_EDIT', 'CUSTOMER_MANAGE'],
  CUSTOMER_EDIT: ['CUSTOMER_UPDATE', 'CUSTOMER_MANAGE'],
  CUSTOMER_MANAGE: ['CUSTOMER_UPDATE', 'CUSTOMER_EDIT'],
  LEAD_ASSIGN: ['LEAD_REASSIGN'],
  LEAD_REASSIGN: ['LEAD_ASSIGN'],
  LEAD_EDIT: ['LEAD_UPDATE'],
  LEAD_UPDATE: ['LEAD_EDIT'],
  PAYMENT_COLLECT: ['PAYMENT_CREATE', 'PAYMENT_MANAGE'],
  PAYMENT_CREATE: ['PAYMENT_COLLECT', 'PAYMENT_MANAGE'],
  PAYMENT_REFUND: ['PAYMENT_REFUND_APPROVE', 'PAYMENT_MANAGE'],
  PAYMENT_REFUND_APPROVE: ['PAYMENT_REFUND', 'PAYMENT_MANAGE'],
  AUDIT_LOG_VIEW: ['AUDIT_VIEW'],
  AUDIT_VIEW: ['AUDIT_LOG_VIEW'],
  SETTINGS_UPDATE: ['SETTINGS_EDIT', 'SETTINGS_MANAGE'],
  SETTINGS_EDIT: ['SETTINGS_UPDATE', 'SETTINGS_MANAGE'],
  BOOKING_UPDATE: ['BOOKING_EDIT'],
  BOOKING_EDIT: ['BOOKING_UPDATE'],
  SERVICE_UPDATE: ['SERVICE_EDIT', 'SERVICE_MANAGE'],
  SERVICE_EDIT: ['SERVICE_UPDATE', 'SERVICE_MANAGE'],
  SERVICE_ACTIVATE: ['SERVICE_EDIT', 'SERVICE_MANAGE'],
  SERVICE_DEACTIVATE: ['SERVICE_EDIT', 'SERVICE_MANAGE'],
  SERVICE_PRICE_EDIT: ['SERVICE_EDIT', 'SERVICE_MANAGE'],
  AMC_PLAN_VIEW: ['AMC_VIEW', 'AMC_MANAGE'],
  AMC_VIEW: ['AMC_PLAN_VIEW'],
  AMC_PLAN_EDIT: ['AMC_EDIT', 'AMC_MANAGE'],
  AMC_PLAN_PRICE_EDIT: ['AMC_PLAN_EDIT', 'AMC_MANAGE'],
  AMC_PLAN_BENEFIT_EDIT: ['AMC_PLAN_EDIT', 'AMC_MANAGE'],
  PARTNER_COMMISSION_VIEW: ['COMMISSION_VIEW', 'COMMISSION_MANAGE'],
  PARTNER_COMMISSION_EDIT: ['COMMISSION_UPDATE', 'COMMISSION_MANAGE'],
};

function hasUserPermission(userPermissions: string[] | undefined, permissionCode: string): boolean {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  if (userPermissions.includes(permissionCode)) return true;
  const aliases = PERMISSION_ALIASES[permissionCode] || [];
  return aliases.some((alias) => userPermissions.includes(alias));
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

    if (!hasUserPermission(req.user.permissions, permissionCode)) {
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
 * Require at least one permission from a list of codes
 */
export function requireAnyPermission(permissionCodes: string[]) {
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

    const hasAny = permissionCodes.some((code) => hasUserPermission(req.user.permissions, code));
    if (!hasAny) {
      logAuditEvent({
        userId: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        entity: 'PERMISSION',
        newValue: { missingAnyPermission: permissionCodes },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Forbidden: Requires at least one of the following permissions: ${permissionCodes.join(', ')}.`,
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
