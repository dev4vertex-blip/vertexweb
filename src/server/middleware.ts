import { Request, Response, NextFunction } from 'express';
import { verifyAuthToken, getFullUserById, logAuditEvent, PlatformType, TokenPayload } from './auth.js';

export interface AuthenticatedRequest extends Request {
  user?: any;
  tokenPayload?: TokenPayload;
}

/**
 * Authentication Middleware: Extracts token from Authorization header or cookie,
 * verifies it against the database, and injects user with permissions and platform into req.user.
 */
export async function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or malformed authorization header. Please log in.',
        },
      });
    }
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

    // Attach validated token payload and authoritative user identity
    req.tokenPayload = payload;
    req.user = {
      ...user,
      platform: payload.platform || user.platform,
    };
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
 * Platform Guard Middleware:
 * Enforces strict isolation across VERTEX's three separate production platforms:
 * 1. BUSINESS (Internal staff, admin, sales, finance, hr, managers)
 * 2. CUSTOMER (End customers self-service)
 * 3. PARTNER (Field technicians & channel partners)
 *
 * This middleware MUST run BEFORE role and permission checks.
 */
export function requirePlatform(requiredPlatform: PlatformType | PlatformType[]) {
  const allowedPlatforms = Array.isArray(requiredPlatform) ? requiredPlatform : [requiredPlatform];

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.tokenPayload) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      });
    }

    const tokenPlatform = req.tokenPayload.platform;
    const userPlatform = req.user.platform;

    // Both token platform claim and user platform profile must match the allowed surface
    if (!allowedPlatforms.includes(tokenPlatform) || !allowedPlatforms.includes(userPlatform)) {
      await logAuditEvent({
        userId: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'CROSS_PLATFORM_ACCESS_DENIED',
        entity: 'PLATFORM_GUARD',
        newValue: {
          tokenPlatform,
          userPlatform,
          requiredPlatforms: allowedPlatforms,
          endpoint: req.originalUrl || req.url,
          method: req.method,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(403).json({
        success: false,
        error: {
          code: 'PLATFORM_FORBIDDEN',
          message: `Forbidden: This endpoint belongs to the [${allowedPlatforms.join('/')}] platform. Access from [${tokenPlatform}] credentials is strictly prohibited.`,
        },
      });
    }

    next();
  };
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
  LEAD_WON: ['LEAD_MARK_WON'],
  LEAD_MARK_WON: ['LEAD_WON'],
  LEAD_LOST: ['LEAD_MARK_LOST'],
  LEAD_MARK_LOST: ['LEAD_LOST'],
  LEAD_VIEW: ['LEAD_VIEW_ALL', 'LEAD_VIEW_OWN', 'LEAD_VIEW_TEAM'],
  LEAD_FOLLOWUP_EDIT: ['LEAD_FOLLOWUP_CREATE', 'LEAD_EDIT'],
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
  LOCATION_VIEW: ['LOCATION_MANAGE'],
  LOCATION_CREATE: ['LOCATION_MANAGE'],
  LOCATION_EDIT: ['LOCATION_UPDATE', 'LOCATION_MANAGE'],
  LOCATION_UPDATE: ['LOCATION_EDIT', 'LOCATION_MANAGE'],
  LOCATION_DELETE: ['LOCATION_MANAGE'],
  LOCATION_ACTIVATE: ['LOCATION_EDIT', 'LOCATION_MANAGE'],
  LOCATION_DEACTIVATE: ['LOCATION_EDIT', 'LOCATION_MANAGE'],
  SERVICE_VIEW: ['SERVICE_MANAGE'],
  SERVICE_UPDATE: ['SERVICE_EDIT', 'SERVICE_MANAGE'],
  SERVICE_EDIT: ['SERVICE_UPDATE', 'SERVICE_MANAGE'],
  SERVICE_CREATE: ['SERVICE_MANAGE'],
  SERVICE_DELETE: ['SERVICE_MANAGE'],
  SERVICE_ACTIVATE: ['SERVICE_EDIT', 'SERVICE_MANAGE'],
  SERVICE_DEACTIVATE: ['SERVICE_EDIT', 'SERVICE_MANAGE'],
  SERVICE_PRICE_EDIT: ['SERVICE_EDIT', 'SERVICE_MANAGE'],
  SERVICE_CATEGORY_MANAGE: ['CATEGORY_MANAGE', 'SERVICE_MANAGE'],
  CATEGORY_MANAGE: ['SERVICE_CATEGORY_MANAGE', 'SERVICE_MANAGE'],
  CATEGORY_VIEW: ['SERVICE_VIEW', 'SERVICE_MANAGE'],
  AMC_PLAN_VIEW: ['AMC_VIEW', 'AMC_MANAGE'],
  AMC_VIEW: ['AMC_PLAN_VIEW'],
  AMC_PLAN_EDIT: ['AMC_EDIT', 'AMC_MANAGE'],
  AMC_PLAN_PRICE_EDIT: ['AMC_PLAN_EDIT', 'AMC_MANAGE'],
  AMC_PLAN_BENEFIT_EDIT: ['AMC_PLAN_EDIT', 'AMC_MANAGE'],
  PARTNER_COMMISSION_VIEW: ['COMMISSION_VIEW', 'COMMISSION_MANAGE'],
  PARTNER_COMMISSION_EDIT: ['COMMISSION_UPDATE', 'COMMISSION_MANAGE'],
  PROMOTION_VIEW: ['PROMOTION_MANAGE', 'MARKETING_MANAGE'],
  PROMOTION_UPDATE: ['PROMOTION_EDIT', 'PROMOTION_MANAGE', 'MARKETING_MANAGE'],
  PROMOTION_EDIT: ['PROMOTION_UPDATE', 'PROMOTION_MANAGE', 'MARKETING_MANAGE'],
  PROMOTION_CREATE: ['PROMOTION_MANAGE', 'MARKETING_MANAGE'],
  PROMOTION_DELETE: ['PROMOTION_MANAGE', 'MARKETING_MANAGE'],
  PROMOTION_ACTIVATE: ['PROMOTION_EDIT', 'PROMOTION_MANAGE', 'MARKETING_MANAGE'],
  PROMOTION_DEACTIVATE: ['PROMOTION_EDIT', 'PROMOTION_MANAGE', 'MARKETING_MANAGE'],
  PROMOTION_MANAGE: ['MARKETING_MANAGE'],
  OFFER_VIEW: ['PROMOTION_VIEW', 'PROMOTION_MANAGE'],
  OFFER_CREATE: ['PROMOTION_CREATE', 'PROMOTION_MANAGE'],
  OFFER_EDIT: ['PROMOTION_EDIT', 'PROMOTION_MANAGE'],
  OFFER_DELETE: ['PROMOTION_DELETE', 'PROMOTION_MANAGE'],
  OFFER_ACTIVATE: ['PROMOTION_ACTIVATE', 'PROMOTION_MANAGE'],
  OFFER_DEACTIVATE: ['PROMOTION_DEACTIVATE', 'PROMOTION_MANAGE'],
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
